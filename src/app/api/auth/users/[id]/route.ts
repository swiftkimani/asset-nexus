import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, getAuthUser, requireRole } from "@/lib/auth"
import { log } from "@/lib/audit"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const existing = await db.execute({ sql: "SELECT id FROM users WHERE id = ?", args: [Number(id)] })
  if (!existing.rows[0]) return NextResponse.json({ detail: "User not found" }, { status: 404 })

  const body = await request.json()
  const { name, role, password } = body

  const updates: string[] = []
  const values: any[] = []

  if (name !== undefined) { updates.push("name = ?"); values.push(name) }
  if (role !== undefined) { updates.push("role = ?"); values.push(role) }
  if (password) {
    const hashed = await hashPassword(password)
    updates.push("password_hash = ?"); values.push(hashed)
  }

  if (updates.length === 0) return NextResponse.json({ detail: "No fields to update" }, { status: 400 })

  values.push(Number(id))
  await db.execute({ sql: `UPDATE users SET ${updates.join(", ")} WHERE id = ?`, args: values })

  const result = await db.execute({ sql: "SELECT id, name, email, role, created_at FROM users WHERE id = ?", args: [Number(id)] })
  await log(user?.email, "update", "user", id, `Updated user id ${id}`)
  return NextResponse.json(result.rows[0])
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const adminCount = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
  const total = (adminCount.rows[0] as unknown as { count: number }).count

  const target = await db.execute({ sql: "SELECT role FROM users WHERE id = ?", args: [Number(id)] })
  if (!target.rows[0]) return NextResponse.json({ detail: "User not found" }, { status: 404 })
  const targetRole = (target.rows[0] as unknown as { role: string }).role

  if (targetRole === "admin" && total <= 1) {
    return NextResponse.json({ detail: "Cannot delete the last admin" }, { status: 400 })
  }

  await db.execute({ sql: "DELETE FROM users WHERE id = ?", args: [Number(id)] })
  await log(user?.email, "delete", "user", id, `Deleted user id ${id}`)
  return NextResponse.json({ message: "User deleted" })
}
