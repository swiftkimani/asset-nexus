import { db } from "./db"

export async function initSchema() {
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
}
