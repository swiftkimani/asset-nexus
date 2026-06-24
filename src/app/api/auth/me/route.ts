import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, hashPassword, verifyPassword } from "@/lib/auth"
import { ensureInitialized } from "@/lib/init"
import { log } from "@/lib/audit"
import { validatePassword } from "@/lib/utils"

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
  }
  return NextResponse.json(user)
}

export async function PUT(request: Request) {
  try {
    await ensureInitialized()
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 })
    }

    const { name, current_password, new_password } = await request.json()

    if (name !== undefined && name !== authUser.name) {
      await db.execute({
        sql: "UPDATE users SET name = ? WHERE email = ?",
        args: [name, authUser.email],
      })
    }

    if (current_password || new_password) {
      if (!current_password || !new_password) {
        return NextResponse.json({ detail: "Both current and new password are required" }, { status: 400 })
      }

      const pwdError = validatePassword(new_password)
      if (pwdError) return NextResponse.json({ detail: pwdError }, { status: 400 })

      const result = await db.execute({
        sql: "SELECT password_hash FROM users WHERE email = ?",
        args: [authUser.email],
      })
      const row = result.rows[0] as Record<string, unknown> | undefined
      if (!row || !(await verifyPassword(current_password, row.password_hash as string))) {
        return NextResponse.json({ detail: "Current password is incorrect" }, { status: 400 })
      }

      const newHash = await hashPassword(new_password)
      await db.execute({
        sql: "UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE email = ?",
        args: [newHash, authUser.email],
      })
    }

    await log(authUser.email, "profile_update", "user", authUser.email,
      name ? `Name changed to ${name}` : "Password changed")

    const updatedResult = await db.execute({
      sql: "SELECT name, email, role FROM users WHERE email = ?",
      args: [authUser.email],
    })
    const updatedUser = updatedResult.rows[0] as Record<string, unknown>

    return NextResponse.json({
      name: updatedUser.name as string,
      email: updatedUser.email as string,
      role: updatedUser.role as string,
    })
  } catch {
    return NextResponse.json({ detail: "Update failed" }, { status: 500 })
  }
}
