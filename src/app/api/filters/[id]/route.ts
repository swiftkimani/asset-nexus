import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, requireRole } from "@/lib/auth"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const existing = await db.execute({
    sql: "SELECT id FROM saved_filters WHERE id = ? AND user_email = ?",
    args: [Number(id), user!.email],
  })
  if (!existing.rows[0]) return NextResponse.json({ detail: "Filter not found" }, { status: 404 })

  await db.execute({ sql: "DELETE FROM saved_filters WHERE id = ?", args: [Number(id)] })
  return NextResponse.json({ message: "Filter deleted" })
}
