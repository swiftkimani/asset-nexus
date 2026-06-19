import { NextResponse } from "next/server"

export async function GET() {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin", "viewer") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  const totalEmployees = await db.execute("SELECT COUNT(*) as count FROM employees WHERE is_deleted = 0")
  const totalAssets = await db.execute("SELECT COUNT(*) as count FROM assets WHERE is_deleted = 0")
  const assignedAssets = await db.execute("SELECT COUNT(*) as count FROM assets WHERE status = 'Assigned' AND is_deleted = 0")
  const availableAssets = await db.execute("SELECT COUNT(*) as count FROM assets WHERE status = 'Available' AND is_deleted = 0")
  const underRepair = await db.execute("SELECT COUNT(*) as count FROM assets WHERE status = 'Under Repair' AND is_deleted = 0")

  return NextResponse.json({
    total_employees: (totalEmployees.rows[0] as unknown as { count: number }).count,
    total_assets: (totalAssets.rows[0] as unknown as { count: number }).count,
    assigned_assets: (assignedAssets.rows[0] as unknown as { count: number }).count,
    available_assets: (availableAssets.rows[0] as unknown as { count: number }).count,
    under_repair_assets: (underRepair.rows[0] as unknown as { count: number }).count,
  })
}
