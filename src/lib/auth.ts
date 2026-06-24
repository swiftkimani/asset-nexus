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

export async function createToken(user: Pick<User, "email" | "role" | "name"> & { org_id?: string | null }): Promise<string> {
  const { db } = await import("@/lib/db")
  const result = await db.execute({ sql: "SELECT token_version, org_id FROM users WHERE email = ?", args: [user.email] })
  const version = (result.rows[0] as any)?.token_version ?? 0
  const orgId = user.org_id ?? (result.rows[0] as any)?.org_id ?? null
  return jwt.sign(
    { sub: user.email, role: user.role, name: user.name, org_id: orgId, token_version: version },
    SECRET_KEY,
    { algorithm: ALGORITHM, expiresIn: `${ACCESS_TOKEN_EXPIRE_MINUTES}m` },
  )
}

export function verifyToken(token: string): { sub: string; role: string; name: string; org_id?: string | null; token_version?: number } | null {
  try {
    return jwt.verify(token, SECRET_KEY, { algorithms: [ALGORITHM] }) as unknown as { sub: string; role: string; name: string; org_id?: string | null; token_version?: number }
  } catch {
    return null
  }
}

export async function getAuthUser(): Promise<{ email: string; role: string; name: string; org_id?: string | null } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (!token) return null
    const payload = verifyToken(token)
    if (!payload) return null

    const { db } = await import("@/lib/db")
    const dbResult = await db.execute({ sql: "SELECT token_version FROM users WHERE email = ?", args: [payload.sub] })
    if (dbResult.rows[0] && (dbResult.rows[0] as any).token_version !== payload.token_version) return null

    return { email: payload.sub, role: payload.role, name: payload.name, org_id: payload.org_id }
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
