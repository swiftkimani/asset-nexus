import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const { id } = await params
    const body = await request.json()
    const { new_employee_id, assigned_date, notes } = body

    const assignment = await db.execute({
      sql: `SELECT aa.*, a.asset_name, e.name as current_employee FROM asset_assignments aa
            LEFT JOIN assets a ON aa.asset_id = a.id
            LEFT JOIN employees e ON aa.employee_id = e.id
            WHERE aa.id = ?`,
      args: [Number(id)],
    })
    if (!assignment.rows[0]) return NextResponse.json({ detail: "Assignment not found" }, { status: 404 })
    const asn = assignment.rows[0] as unknown as { assignment_status: string; asset_id: number; asset_name: string }

    if (asn.assignment_status !== "Assigned") {
      return NextResponse.json({ detail: "Only active assignments can be transferred" }, { status: 400 })
    }

    const employee = await db.execute({
      sql: "SELECT id, name, employment_status, office_location FROM employees WHERE id = ? AND is_deleted = 0",
      args: [Number(new_employee_id)],
    })
    if (!employee.rows[0]) return NextResponse.json({ detail: "Employee not found" }, { status: 404 })
    const emp = employee.rows[0] as unknown as { id: number; name: string; employment_status: string; office_location: string | null }
    if (emp.employment_status !== "Active") {
      return NextResponse.json({ detail: "Cannot transfer to inactive employee" }, { status: 400 })
    }

    const { generateDisplayId } = await import("@/lib/id-gen")
    const asnId = await generateDisplayId("ASN", 5, "asset_assignments", "assignment_id")

    await db.execute({
      sql: "UPDATE asset_assignments SET returned_date = datetime('now'), assignment_status = 'Returned' WHERE id = ?",
      args: [Number(id)],
    })

    if (emp.office_location) {
      await db.execute({
        sql: "UPDATE assets SET asset_location = ? WHERE id = ?",
        args: [emp.office_location, asn.asset_id],
      })
    }

    await db.execute({
      sql: "INSERT INTO asset_assignments (assignment_id, asset_id, employee_id, assigned_date, assignment_status, notes) VALUES (?, ?, ?, ?, 'Assigned', ?)",
      args: [asnId, asn.asset_id, Number(new_employee_id), assigned_date || new Date().toISOString().split("T")[0], notes || null],
    })

    const result = await db.execute({
      sql: `SELECT aa.*, a.asset_name, a.asset_unique_id, e.name as employee_name, e.employee_id as employee_code
            FROM asset_assignments aa LEFT JOIN assets a ON aa.asset_id = a.id LEFT JOIN employees e ON aa.employee_id = e.id
            WHERE aa.assignment_id = ?`,
      args: [asnId],
    })
    await log(user?.email, "create", "assignment", asnId, `Transferred asset ${asn.asset_name} to employee ${emp.name}`)
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ detail: "Failed to transfer asset" }, { status: 500 })
  }
}
