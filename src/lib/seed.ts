import { db } from "./db"
import { hashPassword } from "./auth"

export async function seedDefaults() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@company.com"
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123"
  const adminName = process.env.DEFAULT_ADMIN_NAME || "IT Admin"

  const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [adminEmail] })
  if (existing.rows.length === 0) {
    await db.execute({
      sql: "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      args: [adminName, adminEmail, await hashPassword(adminPassword), "admin"],
    })
  }

  const viewerEmails = (process.env.DEFAULT_VIEWER_EMAILS || "ceo@company.com,hr@company.com,accounts@company.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const viewerPassword = process.env.DEFAULT_VIEWER_PASSWORD || "Viewer@123"

  for (const email of viewerEmails) {
    const exists = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] })
    if (exists.rows.length === 0) {
      const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      await db.execute({
        sql: "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        args: [name, email, await hashPassword(viewerPassword), "viewer"],
      })
    }
  }
}
