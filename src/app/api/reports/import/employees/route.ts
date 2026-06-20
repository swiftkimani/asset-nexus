import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ detail: "File required" }, { status: 400 })

    const buffer = new Uint8Array(await file.arrayBuffer())
    const { default: ExcelJS } = await import("exceljs")
    const workbook = await new ExcelJS.Workbook().xlsx.load(buffer as any)
    const sheet = workbook.worksheets[0]

    let created = 0
    let updated = 0

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const [name, email, phone, designation, department, reporting, office, joining, status, notes] = row.values as string[]
      if (!name || !email) return
    })

    const rows: Array<Record<string, string>> = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const vals = row.values as string[]
      rows.push({
        name: vals[1], email: vals[2], phone: vals[3], designation: vals[4],
        department: vals[5], reporting: vals[6], office: vals[7], joining: vals[8], status: vals[9], notes: vals[10],
      })
    })

    for (const row of rows) {
      if (!row.name || !row.email) continue
      const existing = await db.execute({ sql: "SELECT id FROM employees WHERE email = ?", args: [row.email] })
      if (existing.rows.length > 0) {
        await db.execute({
          sql: `UPDATE employees SET name = ?, phone = ?, designation = ?, department = ?, reporting_person = ?, office_location = ?, joining_date = ?, employment_status = ?, notes = ?, updated_at = datetime('now') WHERE email = ?`,
          args: [row.name, row.phone || null, row.designation || null, row.department || null, row.reporting || null, row.office || null, row.joining || null, row.status || "Active", row.notes || null, row.email],
        })
        updated++
      } else {
        const countResult = await db.execute("SELECT COUNT(*) as count FROM employees")
        const count = (countResult.rows[0] as unknown as { count: number }).count
        const empId = `EMP-${String(count + 1).padStart(4, "0")}`
        await db.execute({
          sql: "INSERT INTO employees (employee_id, name, email, phone, designation, department, reporting_person, office_location, joining_date, employment_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [empId, row.name, row.email, row.phone || null, row.designation || null, row.department || null, row.reporting || null, row.office || null, row.joining || null, row.status || "Active", row.notes || null],
        })
        created++
      }
    }

    await log(user?.email, "import", "employee", null, `Imported ${created} created, ${updated} updated employees`)
    return NextResponse.json({ message: "Employees imported", created, updated })
  } catch {
    return NextResponse.json({ detail: "Import failed" }, { status: 500 })
  }
}
