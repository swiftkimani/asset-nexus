import { NextResponse } from "next/server"

export async function GET() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const result = await db.execute({
    sql: "SELECT COUNT(*) as count FROM notifications n JOIN users u ON u.id = n.user_id WHERE u.email = ? AND n.is_read = 0",
    args: [user!.email],
  })
  const count = (result.rows[0] as unknown as { count: number }).count
  return NextResponse.json({ count })
}
