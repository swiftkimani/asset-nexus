import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const result = await db.execute({ sql: "SELECT * FROM employees WHERE id = ? AND is_deleted = 0", args: [Number(id)] })
  if (!result.rows[0]) return NextResponse.json({ detail: "Employee not found" }, { status: 404 })
  return NextResponse.json(result.rows[0])
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const employee = await db.execute({ sql: "SELECT id FROM employees WHERE id = ? AND is_deleted = 0", args: [Number(id)] })
  if (!employee.rows[0]) return NextResponse.json({ detail: "Employee not found" }, { status: 404 })

  const body = await request.json()
  const fields = ["name", "email", "phone", "designation", "department", "reporting_person", "office_location", "joining_date", "employment_status", "notes"]
  const updates = fields.filter((f) => body[f] !== undefined)
  if (updates.length === 0) return NextResponse.json({ detail: "No fields to update" }, { status: 400 })

  const setClause = updates.map((f) => `${f} = ?`).join(", ")
  const values = updates.map((f) => body[f])
  values.push(Number(id))

  await db.execute({ sql: `UPDATE employees SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, args: values })
  const result = await db.execute({ sql: "SELECT * FROM employees WHERE id = ?", args: [Number(id)] })
  return NextResponse.json(result.rows[0])
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const employee = await db.execute({ sql: "SELECT id FROM employees WHERE id = ? AND is_deleted = 0", args: [Number(id)] })
  if (!employee.rows[0]) return NextResponse.json({ detail: "Employee not found" }, { status: 404 })

  const activeAsns = await db.execute({
    sql: "SELECT id, asset_id FROM asset_assignments WHERE employee_id = ? AND assignment_status = 'Assigned'",
    args: [Number(id)],
  })

  for (const asn of activeAsns.rows as unknown as Array<{ id: number; asset_id: number }>) {
    await db.execute({
      sql: "UPDATE asset_assignments SET assignment_status = 'Returned', returned_date = datetime('now') WHERE id = ?",
      args: [asn.id],
    })
    await db.execute({
      sql: "UPDATE assets SET status = 'Available' WHERE id = ? AND status = 'Assigned'",
      args: [asn.asset_id],
    })
  }

  await db.execute({
    sql: "UPDATE employees SET employment_status = 'Inactive', is_deleted = 1, updated_at = datetime('now') WHERE id = ?",
    args: [Number(id)],
  })

  return NextResponse.json({ message: "Employee deactivated", returned_assets: activeAsns.rows.length })
}
