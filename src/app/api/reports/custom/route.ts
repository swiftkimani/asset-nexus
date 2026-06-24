import { NextResponse } from "next/server"

const ALLOWED_COLUMNS = [
  "asset_id", "asset_unique_id", "asset_name", "category", "brand", "model",
  "serial_number", "purchase_cost", "status", "asset_location", "employee", "department",
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const columnsParam = searchParams.get("columns") || ""
  const fmt = searchParams.get("fmt") || "json"

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const columns = columnsParam.split(",").filter((c) => ALLOWED_COLUMNS.includes(c.trim()))
  if (columns.length === 0) {
    return NextResponse.json({ detail: "No valid columns specified. Allowed: " + ALLOWED_COLUMNS.join(", ") }, { status: 400 })
  }

  const selectCols = columns.map((c) => {
    switch (c.trim()) {
      case "category": return "ac.name as category"
      case "employee": return "e.name as employee"
      case "department": return "e.department as department"
      case "asset_id": return "a.asset_id"
      case "asset_unique_id": return "a.asset_unique_id"
      case "asset_name": return "a.asset_name"
      case "brand": return "a.brand"
      case "model": return "a.model"
      case "serial_number": return "a.serial_number"
      case "purchase_cost": return "a.purchase_cost"
      case "status": return "a.status"
      case "asset_location": return "a.asset_location"
      default: return "a." + c.trim()
    }
  }).join(", ")

  const result = await db.execute({
    sql: `SELECT ${selectCols}
          FROM assets a
          LEFT JOIN asset_categories ac ON a.category_id = ac.id
          LEFT JOIN asset_assignments aa ON aa.asset_id = a.id AND aa.assignment_status = 'Assigned'
          LEFT JOIN employees e ON e.id = aa.employee_id
          WHERE a.is_deleted = 0
          ORDER BY a.id DESC`,
  })

  const rows = result.rows as Array<Record<string, unknown>>

  if (fmt === "csv") {
    if (rows.length === 0) return new Response("", { headers: { "Content-Type": "text/csv" } })
    const csv = [columns.join(","), ...rows.map((r) => columns.map((c) => `"${String(r[c.trim()] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n")
    return new Response(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=custom-report.csv" },
    })
  }

  return NextResponse.json(rows)
}
