import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const asset = await db.execute({ sql: "SELECT id FROM assets WHERE id = ? AND is_deleted = 0", args: [Number(id)] })
  if (!asset.rows[0]) return NextResponse.json({ detail: "Asset not found" }, { status: 404 })

  const body = await request.json()
  const { disposal_date, disposal_method, authorized_by, reason, notes } = body

  if (!disposal_date) {
    return NextResponse.json({ detail: "disposal_date is required" }, { status: 400 })
  }

  const result = await db.execute({
    sql: "INSERT INTO disposal_logs (asset_id, disposal_date, disposal_method, authorized_by, reason, notes) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
    args: [Number(id), disposal_date, disposal_method || "Recycled", authorized_by || null, reason || null, notes || null],
  })

  await db.execute({
    sql: "UPDATE assets SET status = 'Disposed', updated_at = datetime('now') WHERE id = ?",
    args: [Number(id)],
  })

  await log(user?.email, "dispose", "asset", id, `Disposed asset id ${id} via ${disposal_method || "Recycled"}`)

  const disposal = await db.execute({
    sql: "SELECT * FROM disposal_logs WHERE id = ?",
    args: [(result.rows[0] as unknown as { id: number }).id],
  })
  return NextResponse.json(disposal.rows[0], { status: 201 })
}
