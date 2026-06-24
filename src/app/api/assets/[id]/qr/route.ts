import { NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { db } = await import("@/lib/db")
  const { id } = await params
  const result = await db.execute({ sql: "SELECT * FROM assets WHERE id = ? AND is_deleted = 0", args: [Number(id)] })
  if (!result.rows[0]) return NextResponse.json({ detail: "Asset not found" }, { status: 404 })
  const asset = result.rows[0] as Record<string, unknown>
  const reqUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
  const assetUrl = `${reqUrl}/assets/${id}`
  const qrData = JSON.stringify({ id: asset.asset_id, name: asset.asset_name, url: assetUrl })
  const png = await QRCode.toBuffer(qrData, { type: "png", width: 300, margin: 2 })
  return new NextResponse(new Uint8Array(png), { headers: { "Content-Type": "image/png" } })
}
