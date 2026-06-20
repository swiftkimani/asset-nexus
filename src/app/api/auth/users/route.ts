import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, getAuthUser, requireRole } from "@/lib/auth"
import { log } from "@/lib/audit"

export async function GET() {
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const result = await db.execute("SELECT id, name, email, role, created_at FROM users ORDER BY id ASC")
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const user = await getAuthUser()
  try {
    requireRole(user, "admin")
  } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  try {
    const { name, email, password, role } = await request.json()
    if (!name || !email || !password || !role) {
      return NextResponse.json({ detail: "All fields required" }, { status: 400 })
    }

    const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] })
    if (existing.rows.length > 0) {
      return NextResponse.json({ detail: "Email already exists" }, { status: 400 })
    }

    const result = await db.execute({
      sql: "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id, name, email, role, created_at",
      args: [name, email, await hashPassword(password), role],
    })
    await log(user?.email, "create", "user", String((result.rows[0] as Record<string, unknown>).id), `Created user ${email} with role ${role}`)
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ detail: "Failed to create user" }, { status: 500 })
  }
}
