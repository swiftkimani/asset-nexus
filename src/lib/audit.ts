import { db } from "./db"

export async function log(
  userEmail: string | null | undefined,
  action: string,
  entity: string,
  entityId: string | null,
  details: string | null,
) {
  try {
    let userId: number | null = null
    if (userEmail) {
      const result = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [userEmail] })
      if (result.rows[0]) userId = (result.rows[0] as unknown as { id: number }).id
    }
    await db.execute({
      sql: "INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)",
      args: [userId, action, entity, entityId, details],
    })
  } catch {
    // silent — audit should never break the main operation
  }
}
