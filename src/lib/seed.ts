import { db } from "./db"
import { hashPassword } from "./auth"
import { generateDisplayId } from "./id-gen"

export async function seedDefaults() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@company.com"
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123"
  const adminName = process.env.DEFAULT_ADMIN_NAME || "IT Admin"

  const existing = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [adminEmail] })
  if (existing.rows.length === 0) {
    await db.execute({
      sql: "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      args: [adminName, adminEmail, await hashPassword(adminPassword), "admin"],
    })
  }

  const viewerEmails = (process.env.DEFAULT_VIEWER_EMAILS || "ceo@company.com,hr@company.com,accounts@company.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const viewerPassword = process.env.DEFAULT_VIEWER_PASSWORD || "Viewer@123"

  for (const email of viewerEmails) {
    const exists = await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] })
    if (exists.rows.length === 0) {
      const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      await db.execute({
        sql: "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        args: [name, email, await hashPassword(viewerPassword), "viewer"],
      })
    }
  }

  await seedSampleData()
}

async function seedSampleData() {
  const cats = await db.execute("SELECT id FROM asset_categories LIMIT 1")
  if (cats.rows.length > 0) return

  const categories = [
    { name: "Laptop", description: "Portable computers for employees" },
    { name: "Monitor", description: "Desktop displays and screens" },
    { name: "Keyboard", description: "Input peripherals" },
    { name: "Mouse", description: "Pointing devices" },
    { name: "Headset", description: "Audio headsets for calls" },
    { name: "Desk Phone", description: "VoIP desk telephones" },
    { name: "Printer", description: "Printing and scanning devices" },
    { name: "Tablet", description: "Mobile tablets for field work" },
    { name: "Networking", description: "Network infrastructure equipment" },
    { name: "Server", description: "Server hardware" },
  ]

  for (const cat of categories) {
    await db.execute({
      sql: "INSERT INTO asset_categories (name, description) VALUES (?, ?)",
      args: [cat.name, cat.description],
    })
  }

  const employees = [
    { name: "Alice Kamau", email: "alice.kamau@company.com", phone: "+254-701-111-111", designation: "Software Engineer", department: "Engineering", office_location: "Nairobi", joining_date: "2023-03-15" },
    { name: "Bob Ochieng", email: "bob.ochieng@company.com", phone: "+254-702-222-222", designation: "DevOps Lead", department: "Engineering", office_location: "Nairobi", joining_date: "2022-07-01" },
    { name: "Carol Wanjiku", email: "carol.wanjiku@company.com", phone: "+254-703-333-333", designation: "Product Manager", department: "Product", office_location: "Nairobi", joining_date: "2023-01-10" },
    { name: "David Mwangi", email: "david.mwangi@company.com", phone: "+254-704-444-444", designation: "UX Designer", department: "Design", office_location: "Nairobi", joining_date: "2024-02-20" },
    { name: "Eve Nyambura", email: "eve.nyambura@company.com", phone: "+254-705-555-555", designation: "HR Manager", department: "Human Resources", office_location: "Nairobi", joining_date: "2021-09-05" },
    { name: "Frank Otieno", email: "frank.otieno@company.com", phone: "+254-706-666-666", designation: "Finance Analyst", department: "Finance", office_location: "Nairobi", joining_date: "2022-11-12" },
    { name: "Grace Akinyi", email: "grace.akinyi@company.com", phone: "+254-707-777-777", designation: "Marketing Lead", department: "Marketing", office_location: "Nairobi", joining_date: "2023-06-01" },
    { name: "Henry Kiplagat", email: "henry.kiplagat@company.com", phone: "+254-708-888-888", designation: "System Administrator", department: "Engineering", office_location: "Nairobi", joining_date: "2022-04-18" },
    { name: "Irene Chebet", email: "irene.chebet@company.com", phone: "+254-709-999-999", designation: "Data Scientist", department: "Engineering", office_location: "Nairobi", joining_date: "2024-01-08" },
    { name: "James Kariuki", email: "james.kariuki@company.com", phone: "+254-710-000-000", designation: "Support Engineer", department: "Support", office_location: "Nairobi", joining_date: "2023-10-22" },
  ]

  const employeeIds: number[] = []
  for (const emp of employees) {
    const eid = await generateDisplayId("EMP", 4, "employees", "employee_id")
    await db.execute({
      sql: `INSERT INTO employees (employee_id, name, email, phone, designation, department, office_location, joining_date, employment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      args: [eid, emp.name, emp.email, emp.phone, emp.designation, emp.department, emp.office_location, emp.joining_date],
    })
    const row = await db.execute("SELECT last_insert_rowid() AS id")
    employeeIds.push((row.rows[0] as unknown as { id: number }).id)
  }

  const assets = [
    { name: "MacBook Pro 16\" M3", category: "Laptop", brand: "Apple", model: "MacBook Pro 16 M3", serial: "APP-MBP-001", cost: 3499, vendor: "Apple Inc", location: "Nairobi HQ", purchase_date: "2024-01-15", warranty: "2027-01-15" },
    { name: "MacBook Pro 14\" M3", category: "Laptop", brand: "Apple", model: "MacBook Pro 14 M3", serial: "APP-MBP-002", cost: 2999, vendor: "Apple Inc", location: "Nairobi HQ", purchase_date: "2024-01-15", warranty: "2027-01-15" },
    { name: "MacBook Pro 14\" M3", category: "Laptop", brand: "Apple", model: "MacBook Pro 14 M3", serial: "APP-MBP-003", cost: 2999, vendor: "Apple Inc", location: "Nairobi HQ", purchase_date: "2024-02-01", warranty: "2027-02-01" },
    { name: "Dell XPS 15", category: "Laptop", brand: "Dell", model: "XPS 15 9530", serial: "DELL-XPS-001", cost: 2499, vendor: "Dell Technologies", location: "Nairobi HQ", purchase_date: "2023-06-10", warranty: "2026-06-10" },
    { name: "ThinkPad X1 Carbon", category: "Laptop", brand: "Lenovo", model: "X1 Carbon Gen 11", serial: "LEN-TP-001", cost: 2199, vendor: "Lenovo", location: "Nairobi HQ", purchase_date: "2023-08-20", warranty: "2026-08-20" },
    { name: "Dell UltraSharp 27\" 4K", category: "Monitor", brand: "Dell", model: "U2723QE", serial: "MON-DELL-001", cost: 619, vendor: "Dell Technologies", location: "Nairobi HQ", purchase_date: "2024-01-15", warranty: "2027-01-15" },
    { name: "Dell UltraSharp 27\" 4K", category: "Monitor", brand: "Dell", model: "U2723QE", serial: "MON-DELL-002", cost: 619, vendor: "Dell Technologies", location: "Nairobi HQ", purchase_date: "2024-01-15", warranty: "2027-01-15" },
    { name: "LG 32\" 4K Monitor", category: "Monitor", brand: "LG", model: "32UN880-B", serial: "MON-LG-001", cost: 699, vendor: "LG Electronics", location: "Nairobi HQ", purchase_date: "2023-03-01", warranty: "2026-03-01" },
    { name: "Logitech MX Keys", category: "Keyboard", brand: "Logitech", model: "MX Keys", serial: "KB-LOG-001", cost: 119, vendor: "Logitech", location: "Nairobi HQ", purchase_date: "2024-01-15", warranty: "2026-01-15" },
    { name: "Logitech MX Keys", category: "Keyboard", brand: "Logitech", model: "MX Keys", serial: "KB-LOG-002", cost: 119, vendor: "Logitech", location: "Nairobi HQ", purchase_date: "2024-01-15", warranty: "2026-01-15" },
    { name: "Logitech MX Master 3S", category: "Mouse", brand: "Logitech", model: "MX Master 3S", serial: "MS-LOG-001", cost: 99, vendor: "Logitech", location: "Nairobi HQ", purchase_date: "2024-01-15", warranty: "2026-01-15" },
    { name: "Logitech MX Master 3S", category: "Mouse", brand: "Logitech", model: "MX Master 3S", serial: "MS-LOG-002", cost: 99, vendor: "Logitech", location: "Nairobi HQ", purchase_date: "2024-01-15", warranty: "2026-01-15" },
    { name: "Jabra Evolve2 65", category: "Headset", brand: "Jabra", model: "Evolve2 65", serial: "HS-JAB-001", cost: 279, vendor: "Jabra", location: "Nairobi HQ", purchase_date: "2024-02-01", warranty: "2027-02-01" },
    { name: "Jabra Evolve2 65", category: "Headset", brand: "Jabra", model: "Evolve2 65", serial: "HS-JAB-002", cost: 279, vendor: "Jabra", location: "Nairobi HQ", purchase_date: "2024-02-01", warranty: "2027-02-01" },
    { name: "Cisco IP Phone 8845", category: "Desk Phone", brand: "Cisco", model: "IP Phone 8845", serial: "PH-CIS-001", cost: 349, vendor: "Cisco Systems", location: "Nairobi HQ", purchase_date: "2023-05-15", warranty: "2026-05-15" },
    { name: "HP LaserJet Pro M404dn", category: "Printer", brand: "HP", model: "LaserJet Pro M404dn", serial: "PR-HP-001", cost: 499, vendor: "HP Inc", location: "Nairobi HQ", purchase_date: "2023-04-10", warranty: "2026-04-10" },
    { name: "iPad Air 11\" M2", category: "Tablet", brand: "Apple", model: "iPad Air 11 M2", serial: "TAB-APP-001", cost: 799, vendor: "Apple Inc", location: "Nairobi HQ", purchase_date: "2024-03-01", warranty: "2027-03-01" },
    { name: "iPad Air 11\" M2", category: "Tablet", brand: "Apple", model: "iPad Air 11 M2", serial: "TAB-APP-002", cost: 799, vendor: "Apple Inc", location: "Nairobi HQ", purchase_date: "2024-03-01", warranty: "2027-03-01" },
    { name: "Ubiquiti UniFi AP", category: "Networking", brand: "Ubiquiti", model: "U6 Pro", serial: "NET-UBI-001", cost: 159, vendor: "Ubiquiti Inc", location: "Server Room", purchase_date: "2023-07-20", warranty: "2026-07-20" },
    { name: "Dell PowerEdge R760", category: "Server", brand: "Dell", model: "PowerEdge R760", serial: "SRV-DELL-001", cost: 12499, vendor: "Dell Technologies", location: "Server Room", purchase_date: "2023-11-01", warranty: "2028-11-01" },
    { name: "MacBook Air 15\" M3", category: "Laptop", brand: "Apple", model: "MacBook Air 15 M3", serial: "APP-MBA-001", cost: 2299, vendor: "Apple Inc", location: "Nairobi HQ", purchase_date: "2024-04-01", warranty: "2027-04-01" },
    { name: "Logitech MX Keys Mini", category: "Keyboard", brand: "Logitech", model: "MX Keys Mini", serial: "KB-LOG-003", cost: 99, vendor: "Logitech", location: "Nairobi HQ", purchase_date: "2024-04-01", warranty: "2026-04-01" },
    { name: "Samsung 27\" Smart Monitor", category: "Monitor", brand: "Samsung", model: "M7", serial: "MON-SAM-001", cost: 399, vendor: "Samsung", location: "Nairobi HQ", purchase_date: "2023-09-15", warranty: "2026-09-15" },
  ]

  const assetNameToId: Record<string, number> = {}

  for (const asset of assets) {
    const catResult = await db.execute({
      sql: "SELECT id FROM asset_categories WHERE name = ?",
      args: [asset.category],
    })
    const categoryId = (catResult.rows[0] as unknown as { id: number }).id
    const aid = await generateDisplayId("AST", 5, "assets", "asset_id")

    await db.execute({
      sql: `INSERT INTO assets (asset_id, asset_unique_id, asset_name, category_id, brand, model, serial_number, purchase_date, purchase_cost, vendor, warranty_expiry, asset_location, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available')`,
      args: [aid, asset.serial, asset.name, categoryId, asset.brand, asset.model, asset.serial, asset.purchase_date, asset.cost, asset.vendor, asset.warranty, asset.location],
    })
    const row = await db.execute("SELECT last_insert_rowid() AS id")
    const assetId = (row.rows[0] as unknown as { id: number }).id
    assetNameToId[asset.name] = assetId
  }

  const assignments = [
    { asset: "MacBook Pro 16\" M3", employee: "Alice Kamau", date: "2024-01-20", notes: "Primary development machine" },
    { asset: "MacBook Pro 14\" M3", employee: "Bob Ochieng", date: "2024-01-20", notes: "Infrastructure management" },
    { asset: "MacBook Pro 14\" M3", employee: "Carol Wanjiku", date: "2024-02-05", notes: "Product team device" },
    { asset: "Dell XPS 15", employee: "Henry Kiplagat", date: "2023-06-15", notes: "Admin workstation" },
    { asset: "ThinkPad X1 Carbon", employee: "Grace Akinyi", date: "2023-08-25", notes: "Marketing team" },
    { asset: "iPad Air 11\" M2", employee: "Carol Wanjiku", date: "2024-03-05", notes: "Field presentations" },
    { asset: "Jabra Evolve2 65", employee: "Alice Kamau", date: "2024-02-01", notes: "Daily calls" },
    { asset: "Jabra Evolve2 65", employee: "Frank Otieno", date: "2024-02-01", notes: "Finance calls" },
  ]

  for (const assignment of assignments) {
    const empResult = await db.execute({
      sql: "SELECT id FROM employees WHERE name = ?",
      args: [assignment.employee],
    })
    if (empResult.rows.length === 0) continue
    const employeeId = (empResult.rows[0] as unknown as { id: number }).id
    const assetId = assetNameToId[assignment.asset]
    if (!assetId) continue

    const assignId = await generateDisplayId("ASN", 5, "asset_assignments", "assignment_id")

    await db.execute({
      sql: "INSERT INTO asset_assignments (assignment_id, asset_id, employee_id, assigned_date, assignment_status, notes) VALUES (?, ?, ?, ?, 'Assigned', ?)",
      args: [assignId, assetId, employeeId, assignment.date, assignment.notes],
    })

    await db.execute({
      sql: "UPDATE assets SET status = 'Assigned' WHERE id = ?",
      args: [assetId],
    })
  }
}
