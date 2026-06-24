import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const schedules = await db.execute({
    sql: "SELECT * FROM maintenance_schedules WHERE asset_id = ? ORDER BY next_due_date ASC",
    args: [Number(id)],
  })
  return NextResponse.json(schedules.rows)
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
  const { schedule_name, frequency_days, last_done_date, next_due_date, assigned_to, notes, is_active } = body

  if (!schedule_name || !frequency_days || !next_due_date) {
    return NextResponse.json({ detail: "schedule_name, frequency_days, and next_due_date are required" }, { status: 400 })
  }

  const result = await db.execute({
    sql: "INSERT INTO maintenance_schedules (asset_id, schedule_name, frequency_days, last_done_date, next_due_date, assigned_to, notes, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
    args: [Number(id), schedule_name, frequency_days, last_done_date || null, next_due_date, assigned_to || null, notes || null, is_active !== undefined ? (is_active ? 1 : 0) : 1],
  })

  await log(user?.email, "create", "maintenance_schedule", id, `Created maintenance schedule for asset id ${id}`)

  const schedule = await db.execute({
    sql: "SELECT * FROM maintenance_schedules WHERE id = ?",
    args: [(result.rows[0] as unknown as { id: number }).id],
  })
  return NextResponse.json(schedule.rows[0], { status: 201 })
}
