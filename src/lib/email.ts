import nodemailer from "nodemailer"

const smtpHost = process.env.SMTP_HOST || ""
const smtpPort = Number(process.env.SMTP_PORT || "587")
const smtpUser = process.env.SMTP_USER || ""
const smtpPass = process.env.SMTP_PASS || ""
const fromEmail = process.env.SMTP_FROM || "noreply@assetnexus.com"

export async function sendEmail(to: string, subject: string, html: string) {
  if (!smtpHost) return
  const transporter = nodemailer.createTransport({
    host: smtpHost, port: smtpPort, secure: smtpPort === 465,
    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
  })
  await transporter.sendMail({ from: fromEmail, to, subject, html })
}
