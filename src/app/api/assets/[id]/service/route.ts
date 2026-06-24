import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const logs = await db.execute({
    sql: "SELECT * FROM service_logs WHERE asset_id = ? ORDER BY created_at DESC",
    args: [Number(id)],
  })
  return NextResponse.json(logs.rows)
}

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
  const { reported_date, issue_description, vendor, cost, resolution, resolved_date, downtime_days, service_notes } = body

  if (!reported_date || !issue_description) {
    return NextResponse.json({ detail: "reported_date and issue_description are required" }, { status: 400 })
  }

  const result = await db.execute({
    sql: "INSERT INTO service_logs (asset_id, reported_date, issue_description, vendor, cost, resolution, resolved_date, downtime_days, service_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
    args: [Number(id), reported_date, issue_description, vendor || null, cost || null, resolution || null, resolved_date || null, downtime_days || null, service_notes || null],
  })

  await db.execute({
    sql: "UPDATE assets SET status = 'Under Repair', updated_at = datetime('now') WHERE id = ? AND status NOT IN ('Disposed', 'Inactive')",
    args: [Number(id)],
  })

  await log(user?.email, "create", "service_log", id, `Created service log for asset id ${id}`)

  const logEntry = await db.execute({
    sql: "SELECT * FROM service_logs WHERE id = ?",
    args: [(result.rows[0] as unknown as { id: number }).id],
  })
  return NextResponse.json(logEntry.rows[0], { status: 201 })
}
