import { NextResponse } from "next/server"

export async function GET() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const tables = ["users", "employees", "asset_categories", "assets", "asset_assignments", "audit_logs"]
  const counts: Record<string, number> = {}
  for (const table of tables) {
    const result = await db.execute(`SELECT COUNT(*) as count FROM ${table}`)
    counts[table] = (result.rows[0] as unknown as { count: number }).count
  }
  return NextResponse.json({ counts })
}
