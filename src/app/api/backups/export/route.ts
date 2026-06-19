import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const tables = ["users", "employees", "asset_categories", "assets", "asset_assignments", "audit_logs"]
  const data: any = { version: 1, created_at: new Date().toISOString(), counts: {}, tables: {} }

  for (const table of tables) {
    const result = await db.execute(`SELECT * FROM ${table} ORDER BY id ASC`)
    const rows = result.rows as unknown as Array<Record<string, unknown>>
    data.counts[table] = rows.length
    data.tables[table] = rows
  }

  const json = JSON.stringify(data, null, 2)
  const filename = `asset-backup-${new Date().toISOString().slice(0, 10)}.json`

  return new Response(json, {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${filename}"` },
  })
}
