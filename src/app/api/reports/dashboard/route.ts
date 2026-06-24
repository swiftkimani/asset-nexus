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
  const lostAssets = await db.execute("SELECT COUNT(*) as count FROM assets WHERE status = 'Lost' AND is_deleted = 0")
  const disposedAssets = await db.execute("SELECT COUNT(*) as count FROM assets WHERE status = 'Disposed' AND is_deleted = 0")
  const inactiveAssets = await db.execute("SELECT COUNT(*) as count FROM assets WHERE status = 'Inactive' AND is_deleted = 0")

  const statusBreakdown = await db.execute(
    "SELECT status, COUNT(*) as count FROM assets WHERE is_deleted = 0 GROUP BY status ORDER BY count DESC"
  )

  const assetsByCategory = await db.execute(
    "SELECT ac.name, COUNT(a.id) as count FROM assets a JOIN asset_categories ac ON a.category_id = ac.id WHERE a.is_deleted = 0 GROUP BY ac.name ORDER BY count DESC"
  )
  const assignmentsByMonth = await db.execute(
    "SELECT strftime('%Y-%m', assigned_date) as month, COUNT(*) as count FROM asset_assignments WHERE assigned_date >= date('now', '-6 months') GROUP BY month ORDER BY month"
  )
  const departmentAssets = await db.execute(
    "SELECT e.department, COUNT(aa.id) as count FROM employees e LEFT JOIN asset_assignments aa ON e.id = aa.employee_id AND aa.assignment_status = 'Assigned' WHERE e.is_deleted = 0 AND e.department IS NOT NULL GROUP BY e.department ORDER BY count DESC"
  )

  const total = (totalAssets.rows[0] as unknown as { count: number }).count
  const assigned = (assignedAssets.rows[0] as unknown as { count: number }).count
  const repair = (underRepair.rows[0] as unknown as { count: number }).count
  const utilizationRate = total > 0 && total > repair ? Math.round((assigned / (total - repair)) * 100) : 0

  return NextResponse.json({
    total_employees: (totalEmployees.rows[0] as unknown as { count: number }).count,
    total_assets: total,
    assigned_assets: assigned,
    available_assets: (availableAssets.rows[0] as unknown as { count: number }).count,
    under_repair_assets: repair,
    lost_assets: (lostAssets.rows[0] as unknown as { count: number }).count,
    disposed_assets: (disposedAssets.rows[0] as unknown as { count: number }).count,
    inactive_assets: (inactiveAssets.rows[0] as unknown as { count: number }).count,
    utilization_rate: utilizationRate,
    status_breakdown: (statusBreakdown.rows as unknown as { status: string; count: number }[]),
    assets_by_category: (assetsByCategory.rows as unknown as { name: string; count: number }[]),
    assignments_by_month: (assignmentsByMonth.rows as unknown as { month: string; count: number }[]),
    department_assets: (departmentAssets.rows as unknown as { department: string; count: number }[]),
  })
}
