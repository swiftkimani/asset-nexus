import { db } from "@/lib/db"

export const resolvers = {
  Query: {
    assets: async ({ search, status, category, skip = 0, limit = 50 }: any) => {
      let sql = "SELECT a.*, ac.name as category FROM assets a LEFT JOIN asset_categories ac ON a.category_id = ac.id WHERE a.is_deleted = 0"
      const args: any[] = []
      if (search) { sql += " AND (a.asset_name LIKE ? OR a.asset_unique_id LIKE ?)"; const t = `%${search}%`; args.push(t, t) }
      if (status) { sql += " AND a.status = ?"; args.push(status) }
      if (category) { sql += " AND ac.name = ?"; args.push(category) }
      sql += " ORDER BY a.id DESC LIMIT ? OFFSET ?"
      args.push(limit, skip)
      const result = await db.execute({ sql, args })
      return result.rows
    },
    asset: async ({ id }: any) => {
      const result = await db.execute({ sql: "SELECT a.*, ac.name as category FROM assets a LEFT JOIN asset_categories ac ON a.category_id = ac.id WHERE a.id = ? AND a.is_deleted = 0", args: [Number(id)] })
      return result.rows[0] || null
    },
    employees: async ({ search, department, skip = 0, limit = 50 }: any) => {
      let sql = "SELECT * FROM employees WHERE is_deleted = 0"
      const args: any[] = []
      if (search) { sql += " AND (name LIKE ? OR email LIKE ?)"; const t = `%${search}%`; args.push(t, t) }
      if (department) { sql += " AND department = ?"; args.push(department) }
      sql += " ORDER BY id DESC LIMIT ? OFFSET ?"
      args.push(limit, skip)
      const result = await db.execute({ sql, args })
      return result.rows
    },
    employee: async ({ id }: any) => {
      const result = await db.execute({ sql: "SELECT * FROM employees WHERE id = ? AND is_deleted = 0", args: [Number(id)] })
      return result.rows[0] || null
    },
    assignments: async ({ status, skip = 0, limit = 50 }: any) => {
      let sql = "SELECT aa.*, a.asset_name, a.asset_unique_id, e.name as employee_name FROM asset_assignments aa LEFT JOIN assets a ON aa.asset_id = a.id LEFT JOIN employees e ON aa.employee_id = e.id WHERE 1=1"
      const args: any[] = []
      if (status) { sql += " AND aa.assignment_status = ?"; args.push(status) }
      sql += " ORDER BY aa.id DESC LIMIT ? OFFSET ?"
      args.push(limit, skip)
      const result = await db.execute({ sql, args })
      return result.rows
    },
    dashboard: async () => {
      const total = await db.execute("SELECT COUNT(*) as count FROM assets WHERE is_deleted = 0")
      const emp = await db.execute("SELECT COUNT(*) as count FROM employees WHERE is_deleted = 0")
      const assigned = await db.execute("SELECT COUNT(*) as count FROM assets WHERE status = 'Assigned' AND is_deleted = 0")
      const avail = await db.execute("SELECT COUNT(*) as count FROM assets WHERE status = 'Available' AND is_deleted = 0")
      const repair = await db.execute("SELECT COUNT(*) as count FROM assets WHERE status = 'Under Repair' AND is_deleted = 0")
      return {
        total_assets: (total.rows[0] as any).count,
        total_employees: (emp.rows[0] as any).count,
        assigned_assets: (assigned.rows[0] as any).count,
        available_assets: (avail.rows[0] as any).count,
        under_repair_assets: (repair.rows[0] as any).count,
      }
    },
  },
}
