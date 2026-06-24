import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const days = Number(searchParams.get("days") || "30")

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const result = await db.execute({
    sql: `SELECT id, asset_id, asset_name, warranty_expiry
          FROM assets
          WHERE warranty_expiry IS NOT NULL
            AND warranty_expiry BETWEEN date('now') AND date('now', '+' || ? || ' days')
            AND is_deleted = 0
          ORDER BY warranty_expiry ASC`,
    args: [days],
  })

  return NextResponse.json(result.rows)
}
