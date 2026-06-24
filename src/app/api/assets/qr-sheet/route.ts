import { NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get("ids")?.split(",").map(Number).filter(Boolean) || []

  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 })
  }

  if (ids.length === 0) {
    return NextResponse.json({ detail: "No asset IDs provided" }, { status: 400 })
  }

  const placeholders = ids.map(() => "?").join(",")
  const assets = await db.execute({
    sql: `SELECT id, asset_id, asset_name, asset_unique_id FROM assets WHERE id IN (${placeholders}) AND is_deleted = 0`,
    args: ids,
  })

  const rows = assets.rows as unknown as { id: number; asset_id: string; asset_name: string; asset_unique_id: string }[]

  const labels = await Promise.all(
    rows.map(async (a) => {
      const reqUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
      const qrData = JSON.stringify({ id: a.asset_id, name: a.asset_name, url: `/assets/${a.id}` })
      const qrUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 1 })
      return { ...a, qrUrl }
    })
  )

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Asset QR Labels</title>
  <style>
    @page { margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; padding: 4mm; }
    .label { text-align: center; border: 1px solid #ccc; border-radius: 4px; padding: 4mm; page-break-inside: avoid; }
    .label img { width: 100%; max-width: 120px; display: block; margin: 0 auto; }
    .label .name { font-size: 10pt; font-weight: 600; margin-top: 2mm; }
    .label .id { font-size: 8pt; color: #666; font-family: monospace; }
    @media print {
      .sheet { gap: 4mm; padding: 0; }
      .label { border: 1px dashed #999; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    ${labels.map((l) => `<div class="label"><img src="${l.qrUrl}" alt="QR" /><div class="name">${l.asset_name}</div><div class="id">${l.asset_id}</div></div>`).join("")}
  </div>
  <script>window.print()</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  })
}
