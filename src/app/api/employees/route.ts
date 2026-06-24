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

  const userRecord = await db.execute({ sql: "SELECT department, role FROM users WHERE email = ?", args: [user!.email] })
  const userDept = (userRecord.rows[0] as any)?.department
  const isAdmin = (userRecord.rows[0] as any)?.role === "admin"
  if (userDept && !isAdmin) { whereSql += " AND department = ?"; args.push(userDept) }

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

    const { validateEmail, validateBodySize } = await import("@/lib/utils")
    const sizeErr = validateBodySize(request)
    if (sizeErr) return Response.json({ detail: sizeErr }, { status: 413 })

    const emailErr = validateEmail(email)
    if (emailErr) return Response.json({ detail: emailErr }, { status: 400 })

    const normalizedEmail = email.toLowerCase().trim()
    const existing = await db.execute({ sql: "SELECT id FROM employees WHERE LOWER(email) = ?", args: [normalizedEmail] })
    if (existing.rows.length > 0) return Response.json({ detail: "Employee email already exists" }, { status: 400 })

    const { generateDisplayId } = await import("@/lib/id-gen")
    const employeeId = await generateDisplayId("EMP", 4, "employees", "employee_id")

    const result = await db.execute({
      sql: `INSERT INTO employees (employee_id, name, email, phone, designation, department, reporting_person, office_location, joining_date, employment_status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        employeeId, body.name, normalizedEmail, body.phone || null, body.designation || null,
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
