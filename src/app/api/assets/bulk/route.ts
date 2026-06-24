import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const body = await request.json()
    const { action, ids, value } = body

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ detail: "action and ids (non-empty array) are required" }, { status: 400 })
    }

    const placeholders = ids.map(() => "?").join(",")
    let affected: number

    switch (action) {
      case "deactivate": {
        const result = await db.execute({
          sql: `UPDATE assets SET status = 'Inactive', is_deleted = 1, updated_at = datetime('now') WHERE id IN (${placeholders})`,
          args: ids,
        })
        affected = result.rowsAffected
        break
      }
      case "mark_repair": {
        const result = await db.execute({
          sql: `UPDATE assets SET status = 'Under Repair', updated_at = datetime('now') WHERE status = 'Available' AND id IN (${placeholders})`,
          args: ids,
        })
        affected = result.rowsAffected
        break
      }
      case "update_location": {
        if (!value || typeof value !== "string") {
          return NextResponse.json({ detail: "value (string) is required for update_location" }, { status: 400 })
        }
        const result = await db.execute({
          sql: `UPDATE assets SET asset_location = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`,
          args: [value, ...ids],
        })
        affected = result.rowsAffected
        break
      }
      case "set_condition": {
        if (!value || typeof value !== "string") {
          return NextResponse.json({ detail: "value (string) is required for set_condition" }, { status: 400 })
        }
        const result = await db.execute({
          sql: `UPDATE assets SET condition = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`,
          args: [value, ...ids],
        })
        affected = result.rowsAffected
        break
      }
      default:
        return NextResponse.json({ detail: `Unknown action: ${action}` }, { status: 400 })
    }

    await log(user?.email, "bulk", "asset", null, `Bulk ${action} on assets [${ids.join(",")}]${value ? ` = ${value}` : ""} — affected ${affected}`)
    return NextResponse.json({ affected })
  } catch {
    return NextResponse.json({ detail: "Failed to process bulk action" }, { status: 500 })
  }
}
