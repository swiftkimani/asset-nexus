import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { verifyPassword, createToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password required" }, { status: 400 })
    }

    const result = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] })
    const user = result.rows[0] as Record<string, unknown> | undefined
    if (!user || !(await verifyPassword(password, user.password_hash as string))) {
      return NextResponse.json({ detail: "Invalid email or password" }, { status: 401 })
    }

    const token = createToken({
      email: user.email as string,
      role: user.role as string,
      name: user.name as string,
    })

    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    })

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      role: user.role,
      name: user.name,
    })
  } catch (error) {
    return NextResponse.json({ detail: "Login failed" }, { status: 500 })
  }
}
