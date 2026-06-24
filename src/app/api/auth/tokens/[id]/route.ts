import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, requireRole } from "@/lib/auth"
import { log } from "@/lib/audit"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const existing = await db.execute({ sql: "SELECT id, name FROM api_tokens WHERE id = ?", args: [Number(id)] })
  if (!existing.rows[0]) return NextResponse.json({ detail: "Token not found" }, { status: 404 })

  await db.execute({ sql: "UPDATE api_tokens SET is_active = 0 WHERE id = ?", args: [Number(id)] })
  await log(user?.email, "revoke", "api_token", id, `Revoked API token "${(existing.rows[0] as any).name}"`)
  return NextResponse.json({ message: "Token revoked" })
}
