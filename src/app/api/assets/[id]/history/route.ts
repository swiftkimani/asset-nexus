import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const numericId = Number(id)

  const assetResult = await db.execute({
    sql: `SELECT a.*, ac.name as category FROM assets a LEFT JOIN asset_categories ac ON a.category_id = ac.id WHERE a.id = ?`,
    args: [numericId],
  })
  if (!assetResult.rows[0]) return NextResponse.json({ detail: "Asset not found" }, { status: 404 })

  const timeline: Array<{
    date: string
    type: string
    description: string
    user: string
  }> = []

  // Audit logs for this asset entity
  const auditRows = await db.execute({
    sql: `SELECT al.created_at, al.action, al.details, u.email as user_email
          FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
          WHERE al.entity = 'asset' AND (al.entity_id = CAST(? as TEXT) OR al.entity_id = (SELECT asset_id FROM assets WHERE id = ?))
          ORDER BY al.created_at DESC`,
    args: [String(id), numericId],
  })

  for (const row of auditRows.rows) {
    const r = row as unknown as { created_at: string; action: string; details: string | null; user_email: string | null }
    timeline.push({
      date: r.created_at,
      type: r.action,
      description: r.details || r.action,
      user: r.user_email || "System",
    })
  }

  // Assignment events for this asset
  const asnRows = await db.execute({
    sql: `SELECT aa.assigned_date, aa.returned_date, e.name as employee_name
          FROM asset_assignments aa LEFT JOIN employees e ON aa.employee_id = e.id
          WHERE aa.asset_id = ?
          ORDER BY aa.assigned_date DESC`,
    args: [numericId],
  })

  for (const row of asnRows.rows) {
    const r = row as unknown as { assigned_date: string; returned_date: string | null; employee_name: string | null }
    if (r.assigned_date) {
      timeline.push({
        date: r.assigned_date,
        type: "assigned",
        description: `Assigned to ${r.employee_name || "Unknown"}`,
        user: "System",
      })
    }
    if (r.returned_date) {
      timeline.push({
        date: r.returned_date,
        type: "returned",
        description: `Returned by ${r.employee_name || "Unknown"}`,
        user: "System",
      })
    }
  }

  // Sort newest first
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return NextResponse.json({ asset: assetResult.rows[0], history: timeline })
}
