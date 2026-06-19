import { NextResponse } from "next/server"

export async function GET() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const result = await db.execute("SELECT * FROM asset_categories ORDER BY name ASC")
  return NextResponse.json(result.rows)
}
