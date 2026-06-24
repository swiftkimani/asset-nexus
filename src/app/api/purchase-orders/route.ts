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

  const baseSql = "FROM purchase_orders"
  let whereSql = ""
  const args: any[] = []

  if (search) {
    whereSql += " WHERE (po_number LIKE ? OR vendor LIKE ? OR approved_by LIKE ?)"
    const term = `%${search}%`
    args.push(term, term, term)
  }

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count ${baseSql} ${whereSql}`,
    args: [...args],
  })
  const total = (countResult.rows[0] as unknown as { count: number }).count

  const result = await db.execute({
    sql: `SELECT * ${baseSql} ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
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
    const { generateDisplayId } = await import("@/lib/id-gen")
    const poNumber = body.po_number || await generateDisplayId("PO", 5, "purchase_orders", "po_number")

    const result = await db.execute({
      sql: `INSERT INTO purchase_orders (po_number, vendor, order_date, total_amount, status, approved_by, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        poNumber, body.vendor, body.order_date || new Date().toISOString().split("T")[0],
        body.total_amount || null, body.status || "Open", body.approved_by || null, body.notes || null,
      ],
    })
    await log(user?.email, "create", "purchase_order", poNumber, `Created PO ${poNumber}`)
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (e: any) {
    if (e?.message?.includes("UNIQUE")) return NextResponse.json({ detail: "PO number already exists" }, { status: 400 })
    return NextResponse.json({ detail: "Failed to create purchase order" }, { status: 500 })
  }
}
