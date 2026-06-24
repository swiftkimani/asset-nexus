import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const mode = (formData.get("mode") as string) || "replace"

  if (!file) return NextResponse.json({ detail: "File required" }, { status: 400 })

  try {
    const text = await file.text()
    const payload = JSON.parse(text)

    if (payload.version !== 1) return NextResponse.json({ detail: "Unsupported backup version" }, { status: 400 })

    const tables = ["users", "employees", "asset_categories", "assets", "asset_assignments", "audit_logs"]
    const deleteOrder = ["asset_assignments", "assets", "asset_categories", "employees", "audit_logs", "users"]
    const restored: Record<string, number> = {}

    await db.execute("BEGIN TRANSACTION")

    try {
      if (mode === "replace") {
        for (const table of deleteOrder) {
          await db.execute(`DELETE FROM ${table}`)
        }
      }

      for (const table of tables) {
        const rows = payload.tables?.[table] || []
        let count = 0
        for (const row of rows) {
          const cols = Object.keys(row)
          const placeholders = cols.map(() => "?").join(", ")
          const values = cols.map((c) => row[c])

          if (mode === "merge" && row.id) {
            const existing = await db.execute({ sql: `SELECT id FROM ${table} WHERE id = ?`, args: [row.id] })
            if (existing.rows.length > 0) {
              const setClause = cols.filter((c) => c !== "id").map((c) => `${c} = ?`).join(", ")
              const updateValues = cols.filter((c) => c !== "id").map((c) => row[c])
              updateValues.push(row.id)
              await db.execute({ sql: `UPDATE ${table} SET ${setClause} WHERE id = ?`, args: updateValues })
              count++
              continue
            }
          }

          await db.execute({ sql: `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`, args: values })
          count++
        }
        restored[table] = count
      }

      await db.execute("COMMIT")
    } catch (e) {
      await db.execute("ROLLBACK")
      return NextResponse.json({ detail: `Restore failed, rolled back: ${(e as Error).message}` }, { status: 500 })
    }

    return NextResponse.json({ message: "Backup restored (transactional)", mode, restored_counts: restored })
  } catch (e) {
    return NextResponse.json({ detail: `Restore failed: ${(e as Error).message}` }, { status: 500 })
  }
}
