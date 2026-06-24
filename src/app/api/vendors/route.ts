import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const skip = Number(searchParams.get("skip") || "0")
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200)

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const baseSql = "FROM vendors WHERE is_active = 1"
  let whereSql = ""
  const args: any[] = []

  if (search) {
    whereSql += " AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ?)"
    const term = `%${search}%`
    args.push(term, term, term)
  }

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count ${baseSql} ${whereSql}`,
    args: [...args],
  })
  const total = (countResult.rows[0] as unknown as { count: number }).count

  const result = await db.execute({
    sql: `SELECT * ${baseSql} ${whereSql} ORDER BY name ASC LIMIT ? OFFSET ?`,
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
    const result = await db.execute({
      sql: `INSERT INTO vendors (name, contact_person, email, phone, address, rating, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        body.name, body.contact_person || null, body.email || null, body.phone || null,
        body.address || null, body.rating != null ? Number(body.rating) : 3, body.notes || null,
      ],
    })
    await log(user?.email, "create", "vendor", body.name, `Created vendor ${body.name}`)
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (e: any) {
    if (e?.message?.includes("UNIQUE")) return NextResponse.json({ detail: "Vendor name already exists" }, { status: 400 })
    return NextResponse.json({ detail: "Failed to create vendor" }, { status: 500 })
  }
}
