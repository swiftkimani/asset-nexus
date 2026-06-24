import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const claims = await db.execute({
    sql: "SELECT * FROM warranty_claims WHERE asset_id = ? ORDER BY created_at DESC",
    args: [Number(id)],
  })
  return NextResponse.json(claims.rows)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params
  const asset = await db.execute({ sql: "SELECT id, warranty_expiry FROM assets WHERE id = ? AND is_deleted = 0", args: [Number(id)] })
  if (!asset.rows[0]) return NextResponse.json({ detail: "Asset not found" }, { status: 404 })
  const assetRecord = asset.rows[0] as unknown as { id: number; warranty_expiry: string | null }

  if (assetRecord.warranty_expiry && new Date(assetRecord.warranty_expiry) < new Date()) {
    return NextResponse.json({ detail: "Warranty has expired — cannot file new claims" }, { status: 400 })
  }

  const body = await request.json()
  const { claim_number, rma_number, vendor_contact, claim_date, issue_description, status, resolution, resolved_date, notes } = body

  if (!claim_date) {
    return NextResponse.json({ detail: "claim_date is required" }, { status: 400 })
  }

  const result = await db.execute({
    sql: "INSERT INTO warranty_claims (asset_id, claim_number, rma_number, vendor_contact, claim_date, issue_description, status, resolution, resolved_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
    args: [Number(id), claim_number || null, rma_number || null, vendor_contact || null, claim_date, issue_description || null, status || "Open", resolution || null, resolved_date || null, notes || null],
  })

  await log(user?.email, "create", "warranty_claim", id, `Created warranty claim for asset id ${id}`)

  const claim = await db.execute({
    sql: "SELECT * FROM warranty_claims WHERE id = ?",
    args: [(result.rows[0] as unknown as { id: number }).id],
  })
  return NextResponse.json(claim.rows[0], { status: 201 })
}
