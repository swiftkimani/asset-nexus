import { NextResponse } from "next/server"

export async function POST() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { sendEmail } = await import("@/lib/email")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    await sendEmail(user!.email, "Test Email from Asset Nexus", "<h1>Test</h1><p>If you receive this, SMTP is configured correctly.</p>")
    await log(user?.email, "send_test_email", "email", null, "Test email sent")
    return NextResponse.json({ detail: "Test email sent" })
  } catch (err) {
    return NextResponse.json({ detail: "Failed to send test email: " + String(err) }, { status: 500 })
  }
}
