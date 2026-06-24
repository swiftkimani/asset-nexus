import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, requireRole } from "@/lib/auth"

export async function GET(request: Request) {
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const entity = searchParams.get("entity")

  let sql = "SELECT id, user_email, entity, name, filters, created_at FROM saved_filters WHERE user_email = ?"
  const args: any[] = [user!.email]
  if (entity) { sql += " AND entity = ?"; args.push(entity) }
  sql += " ORDER BY id DESC"

  const result = await db.execute({ sql, args })
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  try {
    const { entity, name, filters } = await request.json()
    if (!entity || !name || !filters) {
      return NextResponse.json({ detail: "entity, name, and filters are required" }, { status: 400 })
    }

    const result = await db.execute({
      sql: "INSERT INTO saved_filters (user_email, entity, name, filters) VALUES (?, ?, ?, ?) RETURNING *",
      args: [user!.email, entity, name, typeof filters === "string" ? filters : JSON.stringify(filters)],
    })
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ detail: "Failed to save filter" }, { status: 500 })
  }
}
