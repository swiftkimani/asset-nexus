import { NextResponse } from "next/server"

export async function GET() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const result = await db.execute({
    sql: "SELECT n.* FROM notifications n JOIN users u ON u.id = n.user_id WHERE u.email = ? ORDER BY n.id DESC LIMIT 50",
    args: [user!.email],
  })
  return NextResponse.json(result.rows)
}

export async function POST() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  await db.execute({
    sql: "UPDATE notifications SET is_read = 1 WHERE user_id = (SELECT id FROM users WHERE email = ?)",
    args: [user!.email],
  })
  return NextResponse.json({ success: true })
}
