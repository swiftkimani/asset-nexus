export async function ensureInitialized() {
  const { db } = await import("./db")
  const { initSchema } = await import("./schema")
  const { seedDefaults } = await import("./seed")

  await initSchema()

  const existing = await db.execute("SELECT COUNT(*) as count FROM users")
  if ((existing.rows[0] as unknown as { count: number }).count === 0) {
    await seedDefaults()
  }
}
