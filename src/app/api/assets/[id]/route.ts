import { NextResponse } from "next/server"

async function getOrCreateCategory(db: import("@libsql/client").Client, name: string | null) {
  if (!name) return null
  const existing = await db.execute({ sql: "SELECT id FROM asset_categories WHERE name = ?", args: [name.trim()] })
  if (existing.rows[0]) return (existing.rows[0] as unknown as { id: number }).id
  const result = await db.execute({ sql: "INSERT INTO asset_categories (name) VALUES (?) RETURNING id", args: [name.trim()] })
  return (result.rows[0] as unknown as { id: number }).id
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const asset = await db.execute({ sql: "SELECT id FROM assets WHERE id = ? AND is_deleted = 0", args: [Number(id)] })
  if (!asset.rows[0]) return NextResponse.json({ detail: "Asset not found" }, { status: 404 })

  const body = await request.json()
  const fields = ["asset_unique_id", "asset_name", "brand", "model", "serial_number", "purchase_date", "purchase_cost", "vendor", "warranty_expiry", "asset_location", "status"]

  if (body.category !== undefined) {
    const catId = await getOrCreateCategory(db, body.category)
    await db.execute({ sql: "UPDATE assets SET category_id = ? WHERE id = ?", args: [catId, Number(id)] })
  }

  const updates = fields.filter((f) => body[f] !== undefined)
  if (updates.length > 0) {
    const setClause = updates.map((f) => `${f} = ?`).join(", ")
    const values = updates.map((f) => body[f])
    values.push(Number(id))
    await db.execute({ sql: `UPDATE assets SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, args: values })
  }

  const result = await db.execute({
    sql: "SELECT a.*, ac.name as category FROM assets a LEFT JOIN asset_categories ac ON a.category_id = ac.id WHERE a.id = ?",
    args: [Number(id)],
  })
  await log(user?.email, "update", "asset", id, "Updated asset details")
  return NextResponse.json(result.rows[0])
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const asset = await db.execute({ sql: "SELECT id FROM assets WHERE id = ? AND is_deleted = 0", args: [Number(id)] })
  if (!asset.rows[0]) return NextResponse.json({ detail: "Asset not found" }, { status: 404 })

  await db.execute({
    sql: "UPDATE assets SET status = 'Inactive', is_deleted = 1, updated_at = datetime('now') WHERE id = ?",
    args: [Number(id)],
  })
  await log(user?.email, "deactivate", "asset", id, `Deactivated asset id ${id}`)
  return NextResponse.json({ message: "Asset deactivated" })
}
