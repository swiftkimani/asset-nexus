export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fmt = searchParams.get("fmt") || "csv"

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return Response.json({ detail: "Forbidden" }, { status: 403 }) }

  const result = await db.execute("SELECT a.*, ac.name as category FROM assets a LEFT JOIN asset_categories ac ON a.category_id = ac.id WHERE a.is_deleted = 0 ORDER BY a.id DESC")
  const rows = result.rows as unknown as Array<Record<string, unknown>>

  if (fmt === "csv") {
    const headers = ["asset_id", "asset_unique_id", "asset_name", "category", "brand", "model", "serial_number", "purchase_date", "purchase_cost", "vendor", "warranty_expiry", "asset_location", "status"]
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n")
    return new Response(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=assets.csv" },
    })
  }

  const { default: ExcelJS } = await import("exceljs")
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("assets")
  sheet.columns = [
    { header: "Asset ID", key: "asset_id" }, { header: "Unique ID", key: "asset_unique_id" }, { header: "Name", key: "asset_name" },
    { header: "Category", key: "category" }, { header: "Brand", key: "brand" }, { header: "Model", key: "model" },
    { header: "Serial No", key: "serial_number" }, { header: "Purchase Date", key: "purchase_date" },
    { header: "Cost", key: "purchase_cost" }, { header: "Vendor", key: "vendor" },
    { header: "Warranty Expiry", key: "warranty_expiry" }, { header: "Location", key: "asset_location" }, { header: "Status", key: "status" },
  ]
  rows.forEach((r) => sheet.addRow(r))
  const buffer = await workbook.xlsx.writeBuffer()
  return new Response(buffer, {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=assets.xlsx" },
  })
}
