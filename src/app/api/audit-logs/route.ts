import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const entity = searchParams.get("entity")
  const action = searchParams.get("action")
  const limit = Math.min(Number(searchParams.get("limit") || "100"), 500)
  const offset = Number(searchParams.get("offset") || "0")

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  let sql = `SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1`
  const args: any[] = []

  if (entity) { sql += " AND al.entity = ?"; args.push(entity) }
  if (action) { sql += " AND al.action = ?"; args.push(action) }

  sql += " ORDER BY al.id DESC LIMIT ? OFFSET ?"
  args.push(limit, offset)

  const result = await db.execute({ sql, args })
  return NextResponse.json(result.rows)
}
