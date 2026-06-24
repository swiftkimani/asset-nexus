import { db } from "./db"

async function addColumn(table: string, column: string, def: string) {
  try {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`)
  } catch {
    // column already exists
  }
}

export async function initSchema() {
  await db.execute("PRAGMA foreign_keys = ON")

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      designation TEXT,
      department TEXT,
      reporting_person TEXT,
      office_location TEXT,
      joining_date TEXT,
      employment_status TEXT NOT NULL DEFAULT 'Active',
      notes TEXT,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS asset_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id TEXT NOT NULL UNIQUE,
      asset_unique_id TEXT NOT NULL UNIQUE,
      asset_name TEXT NOT NULL,
      category_id INTEGER REFERENCES asset_categories(id),
      brand TEXT,
      model TEXT,
      serial_number TEXT,
      purchase_date TEXT,
      purchase_cost REAL,
      vendor TEXT,
      warranty_expiry TEXT,
      asset_location TEXT,
      status TEXT NOT NULL DEFAULT 'Available',
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS asset_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id TEXT NOT NULL UNIQUE,
      asset_id INTEGER NOT NULL REFERENCES assets(id),
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      assigned_date TEXT NOT NULL,
      returned_date TEXT,
      assignment_status TEXT NOT NULL DEFAULT 'Assigned',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS disposal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id),
      disposal_date TEXT NOT NULL,
      disposal_method TEXT NOT NULL DEFAULT 'Recycled',
      authorized_by TEXT,
      reason TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS warranty_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id),
      claim_number TEXT,
      rma_number TEXT,
      vendor_contact TEXT,
      claim_date TEXT NOT NULL,
      issue_description TEXT,
      status TEXT NOT NULL DEFAULT 'Open',
      resolution TEXT,
      resolved_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS service_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id),
      reported_date TEXT NOT NULL,
      issue_description TEXT NOT NULL,
      vendor TEXT,
      cost REAL,
      resolution TEXT,
      resolved_date TEXT,
      downtime_days INTEGER,
      service_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS maintenance_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES assets(id),
      schedule_name TEXT NOT NULL,
      frequency_days INTEGER NOT NULL,
      last_done_date TEXT,
      next_due_date TEXT NOT NULL,
      assigned_to TEXT,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number TEXT NOT NULL UNIQUE,
      vendor TEXT NOT NULL,
      order_date TEXT NOT NULL,
      total_amount REAL,
      status TEXT NOT NULL DEFAULT 'Open',
      approved_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      rating INTEGER DEFAULT 3,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS asset_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_name TEXT NOT NULL,
      requester_email TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      category TEXT,
      justification TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      reviewed_by TEXT,
      review_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      last_used_at TEXT,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS saved_filters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      entity TEXT NOT NULL,
      name TEXT NOT NULL,
      filters TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await addColumn("assets", "condition", "TEXT NOT NULL DEFAULT 'Good'")
  await addColumn("assets", "accumulated_maintenance_cost", "REAL DEFAULT 0")
  await addColumn("assets", "depreciation_method", "TEXT DEFAULT 'straight-line'")
  await addColumn("assets", "useful_life_years", "INTEGER DEFAULT 5")
  await addColumn("assets", "salvage_value", "REAL DEFAULT 0")
  await addColumn("users", "department", "TEXT")
  await addColumn("users", "token_version", "INTEGER DEFAULT 0")
  await addColumn("asset_assignments", "expected_return_date", "TEXT")
  await addColumn("users", "org_id", "TEXT")

  await db.execute(`
    CREATE TABLE IF NOT EXISTS report_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      report_type TEXT NOT NULL,
      frequency TEXT NOT NULL,
      recipients TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'csv',
      last_sent_at TEXT,
      next_run_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}
