export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fmt = searchParams.get("fmt") || "csv"

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return Response.json({ detail: "Forbidden" }, { status: 403 }) }

  const result = await db.execute("SELECT * FROM employees WHERE is_deleted = 0 ORDER BY id DESC")
  const rows = result.rows as unknown as Array<Record<string, unknown>>

  if (fmt === "csv") {
    const headers = ["employee_id", "name", "email", "phone", "designation", "department", "reporting_person", "office_location", "joining_date", "employment_status", "notes"]
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n")
    return new Response(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=employees.csv" },
    })
  }

  const { default: ExcelJS } = await import("exceljs")
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("employees")
  sheet.columns = [
    { header: "Employee ID", key: "employee_id" }, { header: "Name", key: "name" }, { header: "Email", key: "email" },
    { header: "Phone", key: "phone" }, { header: "Designation", key: "designation" }, { header: "Department", key: "department" },
    { header: "Reporting Person", key: "reporting_person" }, { header: "Office Location", key: "office_location" },
    { header: "Joining Date", key: "joining_date" }, { header: "Status", key: "employment_status" }, { header: "Notes", key: "notes" },
  ]
  rows.forEach((r) => sheet.addRow(r))
  const buffer = await workbook.xlsx.writeBuffer()
  return new Response(buffer, {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=employees.xlsx" },
  })
}
