import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const body = await request.json()
    const { name, email, asset_ids = [], assignment_notes } = body
    if (!name || !email) return NextResponse.json({ detail: "Name and email required" }, { status: 400 })

    const { validateEmail } = await import("@/lib/utils")
    const emailErr = validateEmail(email)
    if (emailErr) return NextResponse.json({ detail: emailErr }, { status: 400 })

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.execute({ sql: "SELECT id FROM employees WHERE LOWER(email) = ?", args: [normalizedEmail] })
    if (existing.rows.length > 0) return NextResponse.json({ detail: "Employee email already exists" }, { status: 400 })

    const ids = (asset_ids as number[]).filter((id) => id > 0)
    if (ids.length > 0) {
      for (const assetId of ids) {
        const updateResult = await db.execute({
          sql: "UPDATE assets SET status = 'Assigned' WHERE id = ? AND status = 'Available' AND is_deleted = 0",
          args: [assetId],
        })
        if (updateResult.rowsAffected === 0) {
          return NextResponse.json({ detail: `Asset ${assetId} is not available` }, { status: 400 })
        }
      }
    }

    const { generateDisplayId } = await import("@/lib/id-gen")
    const employeeId = await generateDisplayId("EMP", 4, "employees", "employee_id")

    const employeeResult = await db.execute({
      sql: `INSERT INTO employees (employee_id, name, email, phone, designation, department, reporting_person, office_location, joining_date, employment_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, employee_id`,
      args: [
        employeeId, name, normalizedEmail, body.phone || null, body.designation || null,
        body.department || null, body.reporting_person || null, body.office_location || null,
        body.joining_date || null, body.employment_status || "Active", body.notes || null,
      ],
    })
    const emp = employeeResult.rows[0] as unknown as { id: number; employee_id: string }

    let assignedCount = 0
    for (const assetId of ids) {
      const asnId = await generateDisplayId("ASN", 5, "asset_assignments", "assignment_id")

      await db.execute({
        sql: "INSERT INTO asset_assignments (assignment_id, asset_id, employee_id, assigned_date, assignment_status, notes) VALUES (?, ?, ?, datetime('now'), 'Assigned', ?)",
        args: [asnId, assetId, emp.id, assignment_notes || null],
      })
      await db.execute({ sql: "UPDATE assets SET status = 'Assigned' WHERE id = ?", args: [assetId] })
      assignedCount++
    }

    await log(user?.email, "onboard", "employee", emp.employee_id, `Onboarded employee with ${assignedCount} assigned assets`)
    return NextResponse.json({
      message: "Employee onboarded successfully",
      employee_id: emp.id,
      employee_code: emp.employee_id,
      assigned_assets: assignedCount,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ detail: "Failed to onboard employee" }, { status: 500 })
  }
}
