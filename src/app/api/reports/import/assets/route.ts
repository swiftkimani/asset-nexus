import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { getAuthUser, requireRole } = await import("@/lib/auth")
  const { db } = await import("@/lib/db")
  const user = await getAuthUser()
  try { requireRole(user, "admin") } catch { return NextResponse.json({ detail: "Forbidden" }, { status: 403 }) }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ detail: "File required" }, { status: 400 })

    const buffer = new Uint8Array(await file.arrayBuffer())
    const { default: ExcelJS } = await import("exceljs")
    const workbook = await new ExcelJS.Workbook().xlsx.load(buffer as any)
    const sheet = workbook.worksheets[0]

    const rows: Array<Record<string, string>> = []
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      const vals = row.values as string[]
      rows.push({
        asset_unique_id: vals[1], asset_name: vals[2], category: vals[3], brand: vals[4],
        model: vals[5], serial_number: vals[6], purchase_date: vals[7], purchase_cost: vals[8],
        vendor: vals[9], warranty_expiry: vals[10], asset_location: vals[11], status: vals[12],
      })
    })

    let created = 0
    let updated = 0

    for (const row of rows) {
      if (!row.asset_unique_id || !row.asset_name) continue

      let categoryId: number | null = null
      if (row.category) {
        const cat = await db.execute({ sql: "SELECT id FROM asset_categories WHERE name = ?", args: [row.category] })
        if (cat.rows[0]) {
          categoryId = (cat.rows[0] as unknown as { id: number }).id
        } else {
          const newCat = await db.execute({ sql: "INSERT INTO asset_categories (name) VALUES (?) RETURNING id", args: [row.category] })
          categoryId = (newCat.rows[0] as unknown as { id: number }).id
        }
      }

      const existing = await db.execute({ sql: "SELECT id FROM assets WHERE asset_unique_id = ?", args: [row.asset_unique_id] })
      const cost = row.purchase_cost ? Number(row.purchase_cost) : null

      if (existing.rows.length > 0) {
        await db.execute({
          sql: "UPDATE assets SET asset_name = ?, category_id = ?, brand = ?, model = ?, serial_number = ?, purchase_date = ?, purchase_cost = ?, vendor = ?, warranty_expiry = ?, asset_location = ?, status = ?, updated_at = datetime('now') WHERE asset_unique_id = ?",
          args: [row.asset_name, categoryId, row.brand || null, row.model || null, row.serial_number || null, row.purchase_date || null, cost, row.vendor || null, row.warranty_expiry || null, row.asset_location || null, row.status || "Available", row.asset_unique_id],
        })
        updated++
      } else {
        const countResult = await db.execute("SELECT COUNT(*) as count FROM assets")
        const count = (countResult.rows[0] as unknown as { count: number }).count
        const assetId = `AST-${String(count + 1).padStart(5, "0")}`
        await db.execute({
          sql: "INSERT INTO assets (asset_id, asset_unique_id, asset_name, category_id, brand, model, serial_number, purchase_date, purchase_cost, vendor, warranty_expiry, asset_location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [assetId, row.asset_unique_id, row.asset_name, categoryId, row.brand || null, row.model || null, row.serial_number || null, row.purchase_date || null, cost, row.vendor || null, row.warranty_expiry || null, row.asset_location || null, row.status || "Available"],
        })
        created++
      }
    }

    return NextResponse.json({ message: "Assets imported", created, updated })
  } catch {
    return NextResponse.json({ detail: "Import failed" }, { status: 500 })
  }
}
