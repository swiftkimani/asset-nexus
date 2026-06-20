import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const employeeId = searchParams.get("employee_id")
  const assetId = searchParams.get("asset_id")
  const skip = Number(searchParams.get("skip") || "0")
  const limit = Math.min(Number(searchParams.get("limit") || "100"), 300)

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const baseSql = `FROM asset_assignments aa
                   LEFT JOIN assets a ON aa.asset_id = a.id
                   LEFT JOIN employees e ON aa.employee_id = e.id
                   WHERE 1=1`
  let whereSql = ""
  const args: any[] = []

  if (status) { whereSql += " AND aa.assignment_status = ?"; args.push(status) }
  if (employeeId) { whereSql += " AND aa.employee_id = ?"; args.push(Number(employeeId)) }
  if (assetId) { whereSql += " AND aa.asset_id = ?"; args.push(Number(assetId)) }

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count ${baseSql} ${whereSql}`,
    args: [...args],
  })
  const total = (countResult.rows[0] as unknown as { count: number }).count

  const result = await db.execute({
    sql: `SELECT aa.*, a.asset_name, a.asset_unique_id, e.name as employee_name, e.employee_id as employee_code ${baseSql} ${whereSql} ORDER BY aa.id DESC LIMIT ? OFFSET ?`,
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
    const { asset_id, employee_id, assigned_date, notes } = body

    const asset = await db.execute({
      sql: "SELECT id, status FROM assets WHERE id = ? AND is_deleted = 0", args: [asset_id],
    })
    if (!asset.rows[0]) return NextResponse.json({ detail: "Asset not found" }, { status: 404 })
    if ((asset.rows[0] as unknown as { status: string }).status !== "Available") {
      return NextResponse.json({ detail: "Only available assets can be assigned" }, { status: 400 })
    }

    const employee = await db.execute({
      sql: "SELECT id, employment_status FROM employees WHERE id = ? AND is_deleted = 0", args: [employee_id],
    })
    if (!employee.rows[0]) return NextResponse.json({ detail: "Employee not found" }, { status: 404 })
    if ((employee.rows[0] as unknown as { employment_status: string }).employment_status !== "Active") {
      return NextResponse.json({ detail: "Asset cannot be assigned to inactive employee" }, { status: 400 })
    }

    const asnCount = await db.execute("SELECT COUNT(*) as count FROM asset_assignments")
    const num = (asnCount.rows[0] as unknown as { count: number }).count
    const asnId = `ASN-${String(num + 1).padStart(5, "0")}`

    await db.execute({
      sql: "INSERT INTO asset_assignments (assignment_id, asset_id, employee_id, assigned_date, assignment_status, notes) VALUES (?, ?, ?, ?, 'Assigned', ?)",
      args: [asnId, asset_id, employee_id, assigned_date, notes || null],
    })
    await db.execute({ sql: "UPDATE assets SET status = 'Assigned' WHERE id = ?", args: [asset_id] })

    const result = await db.execute({
      sql: `SELECT aa.*, a.asset_name, a.asset_unique_id, e.name as employee_name, e.employee_id as employee_code
            FROM asset_assignments aa LEFT JOIN assets a ON aa.asset_id = a.id LEFT JOIN employees e ON aa.employee_id = e.id
            WHERE aa.assignment_id = ?`,
      args: [asnId],
    })
    await log(user?.email, "create", "assignment", asnId, `Assigned asset ${asset_id} to employee ${employee_id}`)
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ detail: "Failed to create assignment" }, { status: 500 })
  }
}
