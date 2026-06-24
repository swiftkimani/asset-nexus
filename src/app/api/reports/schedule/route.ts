import { NextResponse } from "next/server"

export async function GET() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const result = await db.execute("SELECT * FROM report_schedules ORDER BY created_at DESC")
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const body = await request.json()
  const { name, report_type, frequency, recipients, format } = body

  if (!name || !report_type || !frequency || !recipients) {
    return NextResponse.json({ detail: "name, report_type, frequency, recipients are required" }, { status: 400 })
  }

  const validFrequencies = ["daily", "weekly", "monthly"]
  if (!validFrequencies.includes(frequency)) {
    return NextResponse.json({ detail: "frequency must be daily, weekly, or monthly" }, { status: 400 })
  }

  const daysMap: Record<string, number> = { daily: 1, weekly: 7, monthly: 30 }
  const days = daysMap[frequency]

  const result = await db.execute({
    sql: `INSERT INTO report_schedules (name, report_type, frequency, recipients, format, next_run_at, created_by)
          VALUES (?, ?, ?, ?, ?, datetime('now', '+? days'), ?) RETURNING *`,
    args: [name, report_type, frequency, recipients, format || "csv", days, user?.email],
  })

  await log(user?.email, "create", "report_schedule", String((result.rows[0] as any).id), `Created schedule "${name}"`)
  return NextResponse.json(result.rows[0], { status: 201 })
}
