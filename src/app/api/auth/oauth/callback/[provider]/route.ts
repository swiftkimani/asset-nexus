import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value
  
  if (!code || !state || state !== storedState) {
    return NextResponse.json({ detail: "Invalid OAuth state" }, { status: 400 })
  }
  
  const { getOAuthProviders } = await import("@/lib/oauth")
  const { createToken } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  
  const providers = getOAuthProviders()
  const config = providers.find((p) => p.name === provider)
  if (!config) return NextResponse.json({ detail: "Unsupported provider" }, { status: 400 })
  
  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  })
  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token
  if (!accessToken) return NextResponse.json({ detail: "Failed to get access token" }, { status: 400 })
  
  const userRes = await fetch(config.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const userData = await userRes.json()
  const email = (userData.email || userData.mail || "").toLowerCase()
  const name = userData.name || userData.displayName || email.split("@")[0]
  
  if (!email) return NextResponse.json({ detail: "Could not get email from provider" }, { status: 400 })
  
  let user = await db.execute({ sql: "SELECT email, role, name FROM users WHERE email = ?", args: [email] })
  
  if (user.rows.length === 0) {
    const { hashPassword } = await import("@/lib/auth")
    await db.execute({
      sql: "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      args: [name, email, await hashPassword(crypto.randomUUID()), "viewer"],
    })
    user = await db.execute({ sql: "SELECT email, role, name FROM users WHERE email = ?", args: [email] })
  }
  
  const u = user.rows[0] as unknown as { email: string; role: string; name: string }
  const token = await createToken(u)
  
  const response = new NextResponse(null, { status: 302, headers: { Location: "/dashboard" } })
  response.cookies.set("token", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 })
  response.cookies.set("oauth_state", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 })
  
  return response
}
