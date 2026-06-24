import { NextResponse } from "next/server"

export async function GET() {
  const { db } = await import("@/lib/db")
  const { sendEmail } = await import("@/lib/email")

  const due = await db.execute(`
    SELECT * FROM report_schedules
    WHERE is_active = 1 AND next_run_at <= datetime('now')
  `)

  let sent = 0
  for (const row of due.rows as any[]) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      const reportRes = await fetch(`${baseUrl}/api/reports?name=${row.report_type}&fmt=${row.format}&limit=1000`)
      const reportData = await reportRes.text()

      const recipients = row.recipients.split(",").map((e: string) => e.trim())
      for (const email of recipients) {
        await sendEmail(email, `Scheduled Report: ${row.name}`, `<pre>${reportData.slice(0, 50000)}</pre>`)
      }

      const nextRun = row.frequency === "daily" ? 1 : row.frequency === "weekly" ? 7 : 30
      await db.execute({
        sql: "UPDATE report_schedules SET last_sent_at = datetime('now'), next_run_at = datetime('now', '+? days') WHERE id = ?",
        args: [nextRun, row.id],
      })
      sent++
    } catch (e) {
      console.error(`Failed to send report ${row.id}:`, e)
    }
  }

  return NextResponse.json({ sent })
}
