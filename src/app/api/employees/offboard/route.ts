import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const body = await request.json()
    if (!body.confirm) return NextResponse.json({ detail: "Confirmation is required" }, { status: 400 })

    const employee = await db.execute({
      sql: "SELECT id, employee_id FROM employees WHERE id = ? AND is_deleted = 0",
      args: [body.employee_id],
    })
    if (!employee.rows[0]) return NextResponse.json({ detail: "Employee not found" }, { status: 404 })
    const emp = employee.rows[0] as unknown as { id: number; employee_id: string }

    const activeAsns = await db.execute({
      sql: "SELECT id, asset_id FROM asset_assignments WHERE employee_id = ? AND assignment_status = 'Assigned'",
      args: [emp.id],
    })

    for (const asn of activeAsns.rows as unknown as Array<{ id: number; asset_id: number }>) {
      await db.execute({
        sql: "UPDATE asset_assignments SET assignment_status = 'Returned', returned_date = datetime('now'), notes = COALESCE(?, notes) WHERE id = ?",
        args: [body.notes || null, asn.id],
      })
      await db.execute({
        sql: "UPDATE assets SET status = 'Available' WHERE id = ? AND status = 'Assigned'",
        args: [asn.asset_id],
      })
    }

    await db.execute({
      sql: "UPDATE employees SET employment_status = 'Inactive', is_deleted = 1, updated_at = datetime('now') WHERE id = ?",
      args: [emp.id],
    })

    await log(user?.email, "offboard", "employee", emp.employee_id, `Offboarded employee, returned ${activeAsns.rows.length} assets`)
    return NextResponse.json({
      message: "Employee offboarded successfully",
      employee_id: emp.id,
      employee_code: emp.employee_id,
      returned_assets: activeAsns.rows.length,
    })
  } catch {
    return NextResponse.json({ detail: "Failed to offboard employee" }, { status: 500 })
  }
}
