import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, requireRole, hashPassword } from "@/lib/auth"
import { log } from "@/lib/audit"

export async function GET() {
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const result = await db.execute({
    sql: `SELECT at.id, at.name, at.last_used_at, at.expires_at, at.is_active, at.created_at
          FROM api_tokens at JOIN users u ON at.user_id = u.id WHERE u.email = ? ORDER BY at.id DESC`,
    args: [user!.email],
  })
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  try {
    const { name } = await request.json()
    if (!name) return NextResponse.json({ detail: "Name is required" }, { status: 400 })

    const rawToken = crypto.randomUUID()
    const hash = await hashPassword(rawToken)

    const userResult = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [user!.email] })
    const userId = (userResult.rows[0] as any).id

    await db.execute({
      sql: "INSERT INTO api_tokens (user_id, name, token_hash) VALUES (?, ?, ?)",
      args: [userId, name, hash],
    })
    await log(user?.email, "create", "api_token", name, `Created API token "${name}"`)

    return NextResponse.json({ token: rawToken, name }, { status: 201 })
  } catch {
    return NextResponse.json({ detail: "Failed to create token" }, { status: 500 })
  }
}
