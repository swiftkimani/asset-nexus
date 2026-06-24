import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const skip = Number(searchParams.get("skip") || "0")
  const limit = Math.min(Number(searchParams.get("limit") || "50"), 200)

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const isAdmin = user?.role === "admin"

  let sql = "FROM asset_requests ar WHERE 1=1"
  const args: (string | number)[] = []

  if (status) { sql += " AND ar.status = ?"; args.push(status) }
  if (!isAdmin) { sql += " AND ar.requester_email = ?"; args.push(user!.email) }

  const countResult = await db.execute({ sql: `SELECT COUNT(*) as count ${sql}`, args: [...args] })
  const total = (countResult.rows[0] as unknown as { count: number }).count

  const result = await db.execute({
    sql: `SELECT ar.* ${sql} ORDER BY ar.id DESC LIMIT ? OFFSET ?`,
    args: [...args, limit, skip],
  })
  return NextResponse.json({ data: result.rows, total })
}

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const body = await request.json()
    const { requester_name, requester_email, asset_name, category, justification } = body

    if (!requester_name || !requester_email || !asset_name) {
      return NextResponse.json({ detail: "requester_name, requester_email, and asset_name are required" }, { status: 400 })
    }

    const result = await db.execute({
      sql: `INSERT INTO asset_requests (requester_name, requester_email, asset_name, category, justification)
            VALUES (?, ?, ?, ?, ?) RETURNING *`,
      args: [requester_name, requester_email, asset_name, category || null, justification || null],
    })

    const req = result.rows[0] as Record<string, unknown>
    await log(user?.email, "create", "asset_request", String(req.id), `Asset request created by ${requester_name} for ${asset_name}`)
    return NextResponse.json(req, { status: 201 })
  } catch {
    return NextResponse.json({ detail: "Failed to create request" }, { status: 500 })
  }
}
