import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reportName = searchParams.get("name") || ""
  const fmt = searchParams.get("fmt") || "json"
  const days = Number(searchParams.get("days") || "30")
  const limit = Number(searchParams.get("limit") || "10")

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const reports: Record<string, () => Promise<Array<Record<string, unknown>>>> = {
    "recent-assignments": async () => {
      const result = await db.execute({
        sql: `SELECT aa.assignment_id, a.asset_name, a.asset_unique_id, e.name as employee_name, aa.assigned_date, aa.assignment_status as status
              FROM asset_assignments aa LEFT JOIN assets a ON aa.asset_id = a.id LEFT JOIN employees e ON aa.employee_id = e.id
              ORDER BY aa.id DESC LIMIT ?`,
        args: [limit],
      })
      return result.rows as unknown as Array<Record<string, unknown>>
    },
    "assets-by-employee": async () => {
      const result = await db.execute({
        sql: `SELECT e.employee_id, e.name as employee_name, e.department, a.asset_id, a.asset_unique_id, a.asset_name, ac.name as category, aa.assigned_date
              FROM asset_assignments aa JOIN assets a ON aa.asset_id = a.id JOIN employees e ON aa.employee_id = e.id LEFT JOIN asset_categories ac ON a.category_id = ac.id
              WHERE aa.assignment_status = 'Assigned' ORDER BY aa.id DESC`,
      })
      return result.rows as unknown as Array<Record<string, unknown>>
    },
    "unassigned-assets": async () => {
      const result = await db.execute({
        sql: `SELECT a.asset_id, a.asset_unique_id, a.asset_name, ac.name as category, a.asset_location as location, a.status
              FROM assets a LEFT JOIN asset_categories ac ON a.category_id = ac.id WHERE a.status = 'Available' AND a.is_deleted = 0`,
      })
      return result.rows as unknown as Array<Record<string, unknown>>
    },
    "under-repair": async () => {
      const result = await db.execute({
        sql: `SELECT a.asset_id, a.asset_unique_id, a.asset_name, a.asset_location as location, a.vendor
              FROM assets a WHERE a.status = 'Under Repair' AND a.is_deleted = 0`,
      })
      return result.rows as unknown as Array<Record<string, unknown>>
    },
    "warranty-expiring": async () => {
      const result = await db.execute({
        sql: `SELECT a.asset_id, a.asset_unique_id, a.asset_name, a.warranty_expiry, a.vendor
              FROM assets a WHERE a.warranty_expiry IS NOT NULL AND a.warranty_expiry BETWEEN datetime('now') AND datetime('now', '+' || ? || ' days') AND a.is_deleted = 0`,
        args: [days],
      })
      return result.rows as unknown as Array<Record<string, unknown>>
    },
  }

  const handler = reports[reportName]
  if (!handler) return NextResponse.json({ detail: "Unknown report name" }, { status: 404 })

  const rows = await handler()

  if (fmt === "csv") {
    if (rows.length === 0) return new Response("", { headers: { "Content-Type": "text/csv" } })
    const headers = Object.keys(rows[0])
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n")
    return new Response(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=${reportName}.csv` },
    })
  }

  return NextResponse.json(rows)
}
