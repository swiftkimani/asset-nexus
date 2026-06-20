export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const designation = searchParams.get("designation")
  const department = searchParams.get("department")
  const skip = Number(searchParams.get("skip") || "0")
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200)

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return Response.json({ detail: "Forbidden" }, { status: 403 }) }

  const baseSql = "FROM employees WHERE is_deleted = 0"
  let whereSql = ""
  const args: any[] = []

  if (search) {
    whereSql += " AND (name LIKE ? OR email LIKE ? OR employee_id LIKE ?)"
    const term = `%${search}%`
    args.push(term, term, term)
  }
  if (designation) { whereSql += " AND designation LIKE ?"; args.push(`%${designation}%`) }
  if (department) { whereSql += " AND department LIKE ?"; args.push(`%${department}%`) }

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as count ${baseSql} ${whereSql}`,
    args: [...args],
  })
  const total = (countResult.rows[0] as unknown as { count: number }).count

  const result = await db.execute({
    sql: `SELECT * ${baseSql} ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, skip],
  })
  return Response.json({ data: result.rows, total })
}

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return Response.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const body = await request.json()
    const { name, email } = body

    if (!name || !email) return Response.json({ detail: "Name and email required" }, { status: 400 })

    const existing = await db.execute({ sql: "SELECT id FROM employees WHERE email = ?", args: [email] })
    if (existing.rows.length > 0) return Response.json({ detail: "Employee email already exists" }, { status: 400 })

    const countResult = await db.execute("SELECT COUNT(*) as count FROM employees")
    const count = (countResult.rows[0] as unknown as { count: number }).count
    const employeeId = `EMP-${String(count + 1).padStart(4, "0")}`

    const result = await db.execute({
      sql: `INSERT INTO employees (employee_id, name, email, phone, designation, department, reporting_person, office_location, joining_date, employment_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        employeeId, body.name, body.email, body.phone || null, body.designation || null,
        body.department || null, body.reporting_person || null, body.office_location || null,
        body.joining_date || null, body.employment_status || "Active", body.notes || null,
      ],
    })
    await log(user?.email, "create", "employee", employeeId, `Created employee ${name}`)
    return Response.json(result.rows[0], { status: 201 })
  } catch {
    return Response.json({ detail: "Failed to create employee" }, { status: 500 })
  }
}
