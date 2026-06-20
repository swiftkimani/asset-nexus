import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const { id } = await params
    const body = await request.json()
    const { returned_date, notes } = body

    const assignment = await db.execute({
      sql: "SELECT * FROM asset_assignments WHERE id = ?", args: [Number(id)],
    })
    if (!assignment.rows[0]) return NextResponse.json({ detail: "Assignment not found" }, { status: 404 })
    const asn = assignment.rows[0] as unknown as { assignment_status: string; assigned_date: string; asset_id: number }

    if (asn.assignment_status === "Returned") {
      return NextResponse.json({ detail: "Asset already returned" }, { status: 400 })
    }
    if (returned_date && returned_date < asn.assigned_date) {
      return NextResponse.json({ detail: "Returned date cannot be before assigned date" }, { status: 400 })
    }

    await db.execute({
      sql: "UPDATE asset_assignments SET returned_date = ?, assignment_status = 'Returned', notes = COALESCE(?, notes) WHERE id = ?",
      args: [returned_date, notes || null, Number(id)],
    })
    await db.execute({
      sql: "UPDATE assets SET status = 'Available' WHERE id = ? AND status = 'Assigned'",
      args: [asn.asset_id],
    })

    const result = await db.execute({
      sql: `SELECT aa.*, a.asset_name, a.asset_unique_id, e.name as employee_name, e.employee_id as employee_code
            FROM asset_assignments aa LEFT JOIN assets a ON aa.asset_id = a.id LEFT JOIN employees e ON aa.employee_id = e.id
            WHERE aa.id = ?`,
      args: [Number(id)],
    })
    await log(user?.email, "return", "assignment", id, `Returned asset assignment id ${id}`)
    return NextResponse.json(result.rows[0])
  } catch {
    return NextResponse.json({ detail: "Failed to return asset" }, { status: 500 })
  }
}
