import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const { getOAuthProviders } = await import("@/lib/oauth")
  const providers = getOAuthProviders()
  const config = providers.find((p) => p.name === provider)
  
  if (!config) return NextResponse.json({ detail: "Unsupported OAuth provider" }, { status: 400 })
  
  const state = crypto.randomUUID()
  const url = new URL(config.authorizationUrl)
  url.searchParams.set("client_id", config.clientId)
  url.searchParams.set("redirect_uri", config.redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", config.scope)
  url.searchParams.set("state", state)
  
  const response = new NextResponse(null, { status: 302, headers: { Location: url.toString() } })
  response.cookies.set("oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 300 })
  
  return response
}
