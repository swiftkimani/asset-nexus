let initialized = false

export async function ensureInitialized() {
  if (initialized) return

  const { initSchema } = await import("./schema")
  const { seedDefaults } = await import("./seed")

  await initSchema()
  await seedDefaults()
  initialized = true
}
