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

    const existing = await db.execute({ sql: "SELECT id FROM employees WHERE email = ?", args: [email] })
    if (existing.rows.length > 0) return NextResponse.json({ detail: "Employee email already exists" }, { status: 400 })

    const ids = (asset_ids as number[]).filter((id) => id > 0)
    if (ids.length > 0) {
      for (const assetId of ids) {
        const asset = await db.execute({
          sql: "SELECT id, status FROM assets WHERE id = ? AND is_deleted = 0",
          args: [assetId],
        })
        if (!asset.rows[0]) return NextResponse.json({ detail: `Asset not found: ${assetId}` }, { status: 404 })
        if ((asset.rows[0] as unknown as { status: string }).status !== "Available") {
          return NextResponse.json({ detail: "Asset is not available" }, { status: 400 })
        }
      }
    }

    const countResult = await db.execute("SELECT COUNT(*) as count FROM employees")
    const count = (countResult.rows[0] as unknown as { count: number }).count
    const employeeId = `EMP-${String(count + 1).padStart(4, "0")}`

    const employeeResult = await db.execute({
      sql: `INSERT INTO employees (employee_id, name, email, phone, designation, department, reporting_person, office_location, joining_date, employment_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, employee_id`,
      args: [
        employeeId, name, email, body.phone || null, body.designation || null,
        body.department || null, body.reporting_person || null, body.office_location || null,
        body.joining_date || null, body.employment_status || "Active", body.notes || null,
      ],
    })
    const emp = employeeResult.rows[0] as unknown as { id: number; employee_id: string }

    let assignedCount = 0
    for (const assetId of ids) {
      const asnCount = await db.execute("SELECT COUNT(*) as count FROM asset_assignments")
      const asnNum = (asnCount.rows[0] as unknown as { count: number }).count
      const asnId = `ASN-${String(asnNum + 1).padStart(5, "0")}`

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
