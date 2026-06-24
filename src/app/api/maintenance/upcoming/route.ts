import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get("days") || "30")

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const result = await db.execute({
    sql: `SELECT ms.*, a.asset_name, a.asset_id as asset_display_id
          FROM maintenance_schedules ms
          JOIN assets a ON a.id = ms.asset_id
          WHERE ms.next_due_date BETWEEN date('now') AND date('now', '+' || ? || ' days')
            AND ms.is_active = 1
            AND a.is_deleted = 0
          ORDER BY ms.next_due_date ASC`,
    args: [days],
  })

  return NextResponse.json(result.rows)
}
