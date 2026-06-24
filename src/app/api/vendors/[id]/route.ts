import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const result = await db.execute({ sql: "SELECT * FROM vendors WHERE id = ?", args: [Number(id)] })
  if (!result.rows[0]) return NextResponse.json({ detail: "Vendor not found" }, { status: 404 })
  return NextResponse.json(result.rows[0])
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const existing = await db.execute({ sql: "SELECT id FROM vendors WHERE id = ? AND is_active = 1", args: [Number(id)] })
  if (!existing.rows[0]) return NextResponse.json({ detail: "Vendor not found" }, { status: 404 })

  const body = await request.json()
  const fields = ["name", "contact_person", "email", "phone", "address", "rating", "notes"]
  const updates = fields.filter((f) => body[f] !== undefined)
  if (updates.length > 0) {
    const setClause = updates.map((f) => `${f} = ?`).join(", ")
    const values = updates.map((f) => f === "rating" ? Number(body[f]) : body[f])
    values.push(Number(id))
    await db.execute({ sql: `UPDATE vendors SET ${setClause} WHERE id = ?`, args: values })
  }

  const result = await db.execute({ sql: "SELECT * FROM vendors WHERE id = ?", args: [Number(id)] })
  await log(user?.email, "update", "vendor", id, `Updated vendor id ${id}`)
  return NextResponse.json(result.rows[0])
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const existing = await db.execute({ sql: "SELECT id FROM vendors WHERE id = ? AND is_active = 1", args: [Number(id)] })
  if (!existing.rows[0]) return NextResponse.json({ detail: "Vendor not found" }, { status: 404 })

  await db.execute({ sql: "UPDATE vendors SET is_active = 0 WHERE id = ?", args: [Number(id)] })
  await log(user?.email, "deactivate", "vendor", id, `Deactivated vendor id ${id}`)
  return NextResponse.json({ message: "Vendor deactivated" })
}
