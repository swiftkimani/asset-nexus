import { NextResponse } from "next/server"

export async function GET() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const overdue = await db.execute(`
    SELECT aa.*, a.asset_name, a.asset_unique_id, e.name as employee_name, e.employee_id as employee_code
    FROM asset_assignments aa
    LEFT JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN employees e ON aa.employee_id = e.id
    WHERE aa.assignment_status = 'Assigned'
      AND aa.expected_return_date IS NOT NULL
      AND aa.expected_return_date < date('now')
    ORDER BY aa.expected_return_date ASC
  `)
  return NextResponse.json(overdue.rows)
}
