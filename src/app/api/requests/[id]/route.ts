import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const { log } = await import("@/lib/audit")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const { id } = await params

  const existing = await db.execute({ sql: "SELECT * FROM asset_requests WHERE id = ?", args: [Number(id)] })
  if (!existing.rows[0]) return NextResponse.json({ detail: "Request not found" }, { status: 404 })

  const body = await request.json()
  const { status, review_notes } = body

  if (!status || !["Approved", "Rejected"].includes(status)) {
    return NextResponse.json({ detail: "Status must be 'Approved' or 'Rejected'" }, { status: 400 })
  }

  await db.execute({
    sql: "UPDATE asset_requests SET status = ?, reviewed_by = ?, review_notes = ?, updated_at = datetime('now') WHERE id = ?",
    args: [status, user!.email, review_notes || null, Number(id)],
  })

  const updated = await db.execute({ sql: "SELECT * FROM asset_requests WHERE id = ?", args: [Number(id)] })
  const req = updated.rows[0] as Record<string, unknown>

  await db.execute({
    sql: `INSERT INTO notifications (user_id, title, message, type, link)
          SELECT id, ?, ?, ?, ? FROM users WHERE email = ?`,
    args: [
      status === "Approved" ? "Request Approved" : "Request Rejected",
      `Your request for "${String(req.asset_name ?? "")}" has been ${status.toLowerCase()}${review_notes ? `: ${review_notes}` : "."}`,
      status === "Approved" ? "success" : "error",
      "/requests",
      req.requester_email as string,
    ],
  })

  await log(user?.email, status === "Approved" ? "approve" : "reject", "asset_request", id, `${status} request #${id} for ${String(req.asset_name ?? "")}`)
  return NextResponse.json(updated.rows[0])
}
