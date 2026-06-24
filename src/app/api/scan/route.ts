import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("image") as File | null
    if (!file) {
      return NextResponse.json({ detail: "Image required" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { default: Jimp } = await import("jimp")
    const { default: jsQR } = await import("jsqr")

    const image = await Jimp.read(buffer)
    const width = image.bitmap.width
    const height = image.bitmap.height
    const pixels = new Uint8ClampedArray(image.bitmap.data)
    const code = jsQR(pixels, width, height)

    if (!code) {
      return NextResponse.json({ detail: "No QR code found in image" }, { status: 400 })
    }

    const data = JSON.parse(code.data)
    const assetId = data.id || data.asset_id
    const url = data.url || `/assets/${assetId}`

    return NextResponse.json({ asset_id: String(assetId), url })
  } catch {
    return NextResponse.json({ detail: "Failed to scan image" }, { status: 500 })
  }
}
