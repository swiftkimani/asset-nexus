import { db } from "./db"

export async function generateDisplayId(prefix: string, padLen: number, table: string, idColumn: string): Promise<string> {
  const prefixLen = prefix.length + 1
  const result = await db.execute({
    sql: `SELECT COALESCE(MAX(CAST(SUBSTR(${idColumn}, ?) AS INTEGER)), 0) + 1 AS next FROM ${table}`,
    args: [prefixLen],
  })
  const next = (result.rows[0] as unknown as { next: number }).next
  return `${prefix}-${String(next).padStart(padLen, "0")}`
}
