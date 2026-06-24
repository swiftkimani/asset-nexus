import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const existing = await db.execute({ sql: "SELECT id FROM report_schedules WHERE id = ?", args: [Number(id)] })
  if (!existing.rows[0]) return NextResponse.json({ detail: "Schedule not found" }, { status: 404 })

  const body = await request.json()
  const fields = ["name", "report_type", "frequency", "recipients", "format", "is_active"]
  const updates: string[] = []
  const values: any[] = []

  for (const f of fields) {
    if (body[f] !== undefined) {
      updates.push(`${f} = ?`)
      values.push(body[f])
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ detail: "No fields to update" }, { status: 400 })
  }

  if (body.frequency && !["daily", "weekly", "monthly"].includes(body.frequency)) {
    return NextResponse.json({ detail: "frequency must be daily, weekly, or monthly" }, { status: 400 })
  }

  if (body.frequency) {
    const daysMap: Record<string, number> = { daily: 1, weekly: 7, monthly: 30 }
    updates.push("next_run_at = datetime('now', '+? days')")
    values.push(daysMap[body.frequency])
  }

  values.push(Number(id))
  await db.execute({ sql: `UPDATE report_schedules SET ${updates.join(", ")} WHERE id = ?`, args: values })

  const result = await db.execute({ sql: "SELECT * FROM report_schedules WHERE id = ?", args: [Number(id)] })
  await log(user?.email, "update", "report_schedule", id, `Updated schedule id ${id}`)
  return NextResponse.json(result.rows[0])
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const existing = await db.execute({ sql: "SELECT id FROM report_schedules WHERE id = ?", args: [Number(id)] })
  if (!existing.rows[0]) return NextResponse.json({ detail: "Schedule not found" }, { status: 404 })

  await db.execute({ sql: "UPDATE report_schedules SET is_active = 0 WHERE id = ?", args: [Number(id)] })
  await log(user?.email, "deactivate", "report_schedule", id, `Deactivated schedule id ${id}`)
  return NextResponse.json({ message: "Schedule deactivated" })
}
