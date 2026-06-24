import { db } from "./db"

export async function scopeQuery(user: { email: string; role: string }): Promise<string | null> {
  if (user.role === "admin") return null
  const result = await db.execute({ sql: "SELECT org_id FROM users WHERE email = ?", args: [user.email] })
  const orgId = (result.rows[0] as any)?.org_id
  return orgId || null
}
