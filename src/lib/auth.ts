import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import type { User } from "@/types"

const SECRET_KEY = process.env.SECRET_KEY || "change-this-secret"
const ALGORITHM = "HS256"
const ACCESS_TOKEN_EXPIRE_MINUTES = Number.parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "60")

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed)
}

export function createToken(user: Pick<User, "email" | "role" | "name">): string {
  return jwt.sign(
    { sub: user.email, role: user.role, name: user.name },
    SECRET_KEY,
    { algorithm: ALGORITHM, expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` },
  )
}

export function verifyToken(token: string): { sub: string; role: string; name: string } | null {
  try {
    return jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] }) as unknown as { sub: string; role: string; name: string }
  } catch {
    return null
  }
}

export async function getAuthUser(): Promise<{ email: string; role: string; name: string } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) return null
    const payload = verifyToken(token)
    if (!payload) return null
    return { email: payload.sub, role: payload.role, name: payload.name }
  } catch {
    return null
  }
}

export function requireRole(user: { role: string } | null, ...roles: string[]): void {
  if (!user || !roles.includes(user.role)) {
    throw new Error("Forbidden")
  }
}

export function getTokenFromHeader(request: Request): string | null {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice(7)
}
