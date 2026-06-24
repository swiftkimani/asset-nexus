import { NextResponse } from "next/server"

async function getOrCreateCategory(db: import("@libsql/client").Client, name: string | null) {
  if (!name) return null
  const existing = await db.execute({ sql: "SELECT id FROM asset_categories WHERE name = ?", args: [name.trim()] })
  if (existing.rows[0]) return (existing.rows[0] as unknown as { id: number }).id
  const result = await db.execute({ sql: "INSERT INTO asset_categories (name) VALUES (?) RETURNING id", args: [name.trim()] })
  return (result.rows[0] as unknown as { id: number }).id
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const category = searchParams.get("category")
  const status = searchParams.get("status")
  const assignedEmployee = searchParams.get("assigned_employee")
  const skip = Number(searchParams.get("skip") || "0")
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200)

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const baseSql = `FROM assets a LEFT JOIN asset_categories ac ON a.category_id = ac.id WHERE a.is_deleted = 0`
  let whereSql = ``
  const args: any[] = []

  if (search) {
    whereSql += " AND (a.asset_id LIKE ? OR a.asset_unique_id LIKE ? OR a.asset_name LIKE ?)"
    const term = `%${search}%`
    args.push(term, term, term)
  }
  if (category) { whereSql += " AND ac.name LIKE ?"; args.push(`%${category}%`) }
  if (status) { whereSql += " AND a.status = ?"; args.push(status) }
  if (assignedEmployee) {
    whereSql += " AND EXISTS (SELECT 1 FROM asset_assignments aa JOIN employees e ON e.id = aa.employee_id WHERE aa.asset_id = a.id AND aa.assignment_status = 'Assigned' AND e.name LIKE ?)"
    args.push(`%${assignedEmployee}%`)
  }

  const userRecord = await db.execute({ sql: "SELECT department, role FROM users WHERE email = ?", args: [user!.email] })
  const userDept = (userRecord.rows[0] as any)?.department
  const isAdmin = (userRecord.rows[0] as any)?.role === "admin"
  if (userDept && !isAdmin) {
    whereSql += " AND (a.asset_location = ? OR EXISTS (SELECT 1 FROM asset_assignments aa2 JOIN employees e2 ON e2.id = aa2.employee_id WHERE aa2.asset_id = a.id AND e2.department = ?))"
    args.push(userDept, userDept)
  }

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count ${baseSql} ${whereSql}`,
    args: [...args],
  })
  const total = (countResult.rows[0] as unknown as { count: number }).count

  const result = await db.execute({
    sql: `SELECT a.*, ac.name as category ${baseSql} ${whereSql} ORDER BY a.id DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, skip],
  })
  return NextResponse.json({ data: result.rows, total })
}

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const body = await request.json()
    const { validateBodySize } = await import("@/lib/utils")
    const sizeErr = validateBodySize(request)
    if (sizeErr) return NextResponse.json({ detail: sizeErr }, { status: 413 })

    const existing = await db.execute({
      sql: "SELECT id FROM assets WHERE asset_unique_id = ?", args: [body.asset_unique_id],
    })
    if (existing.rows.length > 0) return NextResponse.json({ detail: "Asset unique ID already exists" }, { status: 400 })

    if (body.serial_number) {
      const dup = await db.execute({ sql: "SELECT id FROM assets WHERE serial_number = ? AND is_deleted = 0", args: [body.serial_number] })
      if (dup.rows.length > 0) return NextResponse.json({ detail: "Serial number must be unique" }, { status: 400 })
    }

    const { generateDisplayId } = await import("@/lib/id-gen")
    const assetId = await generateDisplayId("AST", 5, "assets", "asset_id")

    const categoryId = await getOrCreateCategory(db, body.category)

    const result = await db.execute({
      sql: `INSERT INTO assets (asset_id, asset_unique_id, asset_name, category_id, brand, model, serial_number, purchase_date, purchase_cost, vendor, warranty_expiry, asset_location, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        assetId, body.asset_unique_id, body.asset_name, categoryId, body.brand || null, body.model || null,
        body.serial_number || null, body.purchase_date || null, body.purchase_cost || null, body.vendor || null,
        body.warranty_expiry || null, body.asset_location || null, body.status || "Available",
      ],
    })

    const asset = result.rows[0] as Record<string, unknown>
    const catResult = await db.execute({ sql: "SELECT name FROM asset_categories WHERE id = ?", args: [categoryId] })
    asset.category = catResult.rows[0] ? (catResult.rows[0] as unknown as { name: string }).name : null
    await log(user?.email, "create", "asset", asset.asset_id as string, `Created asset ${asset.asset_name}`)
    return NextResponse.json(asset, { status: 201 })
  } catch {
    return NextResponse.json({ detail: "Failed to create asset" }, { status: 500 })
  }
}
