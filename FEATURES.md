# Asset Nexus — Feature Roadmap

## Legend
- **IMMEDIATE** — low effort, high impact; address existing gaps
- **SHORT-TERM** — core functionality for a production-ready system
- **MEDIUM-TERM** — major capability adds
- **LONG-TERM** — advanced / enterprise-grade

---

## 1. Fix Existing Gaps (IMMEDIATE)

### 1.1 Edit Asset UI
**What:** API `PUT /api/assets/:id` exists but the Assets page has no Edit button — only Deactivate.

**How:**
- Copy the pattern from the Employees page (edit dialog with pre-filled fields, `onSubmit` calls `PUT`).
- Add an "Edit" button next to "Deactivate" in the assets table row.
- Create an `EditAssetDialog` component mirroring the `AddAssetDialog` fields but with `defaultValue` from the selected asset.

### 1.2 User Management Page
**What:** API `POST /api/auth/users` exists but there is no UI to list, edit, or manage users.

**How:**
- Add a **Settings** nav item (gear icon) visible only to admins.
- Create `src/app/(app)/settings/page.tsx` with:
  - Users table listing all users from a new `GET /api/auth/users` endpoint.
  - "Add User" dialog (name, email, password, role selector).
  - "Edit" dialog to change name/role (not password).
  - "Reset Password" action.
  - "Delete User" action (prevent deleting the last admin).
- Add `GET /api/auth/users` and `PUT /api/auth/users/:id` routes.

### 1.3 Audit Trail
**What:** The `audit_logs` table exists but nothing ever writes to it.

**How:**
- Create a helper in `src/lib/audit.ts`:
  ```typescript
  import { db } from "./db"

  export async function log(
    userId: number | null,
    action: string,
    entity: string,
    entityId: string | null,
    details: string | null,
  ) {
    await db.execute({
      sql: "INSERT INTO audit_logs (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)",
      args: [userId, action, entity, entityId, details],
    })
  }
  ```
- Call it at the end of every state-changing API route (create/update/delete of employees, assets, assignments, users).
- Add an **Audit Log** page or section under Settings to browse/search logs with date range filtering.

### 1.4 Onboard / Offboard UI
**What:** API endpoints exist on the backend but the Employees page only has Add/Edit/Deactivate.

**How:**
- Add an **Onboard** dialog button: fields for employee details + multi-select asset assignment in one form. Calls `POST /api/employees/onboard`.
- Add an **Offboard** action button (next to Deactivate): shows employee name, lists currently assigned assets, warns they'll be auto-returned, calls `POST /api/employees/offboard`.
- In both cases, use a confirmation modal instead of `confirm()`.

### 1.5 "Under Repair" Status Action
**What:** The status filter and reports support "Under Repair" but there's no UI to set it.

**How:**
- Add a **Mark Under Repair** button in the Assets table row actions (between Edit and Deactivate).
- Add a dedicated API route `PUT /api/assets/:id/status` accepting `{ status: "Under Repair" }` (or extend the existing `PUT /api/assets/:id`).
- Show a date/reason/expected-resolution dialog before setting.

### 1.6 Pagination UI
**What:** API supports `skip`/`limit` but the frontend fetches everything.

**How:**
- Change the API response format to return `{ data: [...], total: N }` instead of bare arrays (keep backward compat or move all pages in one sweep).
- Add a shared `Pagination` component (`src/components/ui/pagination.tsx`) with page numbers and prev/next.
- Track `page`, `totalPages`, `perPage` in each list page state.
- Add page size selector (10/25/50/100).

### 1.7 Role-Based UI Hiding
**What:** Viewers see Add/Edit/Deactivate buttons but get 403 errors.

**How:**
- Expose the current user's role from `useAuth()` (already there).
- Hide admin-only buttons when `user.role !== "admin"`:
  - "Add" buttons
  - "Edit" / "Deactivate" row actions
  - Import tabs in Reports
  - Settings/User Management
- Optionally show a muted message: "Contact an admin to add records."

### 1.8 Loading and Empty States
**What:** No spinners, no error boundaries, bare `confirm()` dialogs.

**How:**
- Add a `LoadingSkeleton` component:
  ```tsx
  export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
    return (
      <div className="animate-pulse space-y-2 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 bg-muted rounded w-full" />
            ))}
          </div>
        ))}
      </div>
    )
  }
  ```
- Show `<TableSkeleton />` while data loads in each page.
- Add an `EmptyState` component with an illustration/icon and a "Get started" CTA.
- Replace all `confirm()` calls with a proper `<ConfirmDialog>` component built on `AlertDialog` from Radix.
- Wrap each page in a React error boundary.

---

## 2. Asset Lifecycle & Tracking (SHORT-TERM)

### 2.1 Asset History Timeline
**What:** Per-asset view showing every assign/return/maintenance/service event in chronological order.

**How:**
- Create `GET /api/assets/:id/history` that unions `asset_assignments`, `audit_logs` (action LIKE '%asset%'), and a new `maintenance_logs` table, ordered by date.
- Create `src/app/(app)/assets/[id]/page.tsx` — detail page with:
  - Asset info card (name, ID, serial, category, cost, warranty, location).
  - Status badge and current assignee (if assigned).
  - Timeline component (vertical timeline with icons per event type).
- Add a link to the detail page from the asset ID in the assets table.

### 2.2 QR / Barcode Label Generation
**What:** Printable labels for physical asset tagging; scan to look up or re-assign.

**How:**
- Create `GET /api/assets/:id/qr` returning a QR code PNG (use a server-side lib like `qrcode`).
- Add a **Print Label** button in the asset detail page or table row.
- Generate an A4/letter-sized printable sheet with multiple labels (asset name, ID, QR code, category).
- For mobile, add a `/scan` route that opens the camera (via generic `input[type=file] capture` or `html5-qrcode` library) and looks up the scanned asset.

### 2.3 Asset Transfer (Reassign Without Return)
**What:** Move an asset directly from one employee to another without a return + re-assign cycle.

**How:**
- Add `POST /api/assignments/:id/transfer` route that:
  - Marks current assignment as `Returned` with `returned_date = now()`.
  - Creates a new assignment with the new employee and `assigned_date = now()`.
  - Keeps asset status as `Assigned` throughout.
- Add a **Transfer** button next to **Return** in the assignments table, with a dialog to select the new employee.

### 2.4 Bulk Operations
**What:** Select multiple assets and perform batch actions.

**How:**
- Add checkbox column to assets table.
- Show a floating action bar when items are selected: "Assign to Employee", "Update Location", "Export Selected", "Deactivate".
- Create `POST /api/assets/bulk` with an action field and array of IDs.
- Use optimistic UI with a progress indicator for large batches.

### 2.5 Disposal / Retirement
**What:** Mark assets as disposed with reason, date, approval, and disposal method.

**How:**
- Add `disposed` status to assets (plus disposal fields: `disposal_date`, `disposal_method`, `disposal_authorized_by`, `disposal_notes`).
- Add a `dispose_assets` table for tracking batches of disposals.
- Create a **Disposal** dialog from the asset detail page.
- Add a **Disposed Assets** report filter.

---

## 3. Maintenance & Service (SHORT-TERM)

### 3.1 Scheduled Maintenance
**What:** Define recurring maintenance schedules per asset category or individual asset with due-date alerts.

**How:**
- Create `maintenance_schedules` table:
  ```sql
  CREATE TABLE maintenance_schedules (
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
  ```
- Dashboard widget: "Upcoming Maintenance" showing items due within 7/30 days.
- Add maintenance schedule management to the asset detail page.
- `POST /api/maintenance/complete` to log completion and calculate next due date.

### 3.2 Service / Repair Log
**What:** Track each repair event: date reported, issue description, vendor, cost, resolution, downtime.

**How:**
- Create `service_logs` table:
  ```sql
  CREATE TABLE service_logs (
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
  ```
- Add **Service Log** tab on asset detail page with a form to log new service events.
- Expose service history in the asset timeline (2.1).

### 3.3 Warranty Claims
**What:** Track warranty claims: claim number, RMA, vendor contact, status, resolution.

**How:**
- Add `warranty_claims` table linked to `assets`:
  ```sql
  CREATE TABLE warranty_claims (
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
  ```
- Add a **Warranty** section in the asset detail page showing claim history and a "File Claim" button (only when asset is under warranty).

---

## 4. Procurement & Finance (MEDIUM-TERM)

### 4.1 Depreciation Tracking
**What:** Calculate and display book value using straight-line or declining-balance methods.

**How:**
- Use `purchase_cost`, `purchase_date`, and a new `depreciation_method` / `useful_life_years` / `salvage_value` fields on the `assets` table.
- Compute current book value in SQL or a utility function:
  ```typescript
  function straightLineDepreciation(cost: number, salvage: number, lifeYears: number, yearsOwned: number): number {
    const annual = (cost - salvage) / lifeYears
    const accumulated = Math.min(annual * yearsOwned, cost - salvage)
    return cost - accumulated
  }
  ```
- Display **Current Value** column in the assets table.
- Add a **Depreciation Schedule** report.

### 4.2 Purchase Order Integration
**What:** Link assets to purchase orders for budget tracking.

**How:**
- Create `purchase_orders` table:
  ```sql
  CREATE TABLE purchase_orders (
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
  ```
- Add `po_id INTEGER REFERENCES purchase_orders(id)` to the `assets` table.
- Create a **Purchase Orders** page under a new **Procurement** nav section.
- Show PO link and budget remaining in the asset form.

### 4.3 Vendor Directory
**What:** Centralized vendor list with contact info, performance rating, and warranty terms.

**How:**
- Create `vendors` table and a Vendors page under Procurement.
- Link `assets.vendor` to `vendors.id` via foreign key.
- Vendor detail page shows all associated assets, POs, and service history.

---

## 5. Process & Workflow (MEDIUM-TERM)

### 5.1 Asset Request Workflow
**What:** Employee requests an asset → Manager approves → Admin assigns.

**How:**
- Create `asset_requests` table:
  ```sql
  CREATE TABLE asset_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    category TEXT,
    justification TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',   -- Pending, Approved, Rejected, Fulfilled
    reviewed_by TEXT,
    review_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
  ```
- Add **Request Asset** page accessible to all users (even viewers).
- Add **Pending Requests** badge on the sidebar for admins.
- Approve/Reject dialog assigns the asset and auto-creates an assignment.
- Email notifications via a notification service (5.4).

### 5.2 Approval Queues
**What:** Dashboard for managers showing pending requests and approval actions.

**How:**
- Add an **Approvals** section to the sidebar (admin-only).
- List pending requests with bulk approve/reject actions.
- Show a "pending approvals" count badge.

### 5.3 Notification System
**What:** In-app and email alerts for key events.

**How:**
- Create `notifications` table:
  ```sql
  CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,  -- assignment, return, warranty, maintenance, request
    link TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
  ```
- Add a bell icon in the sidebar header → notification dropdown.
- Push notifications via Server-Sent Events or polling.
- For email: integrate `nodemailer` (or Resend / SendGrid). Add `smtp_*` env vars and a `sendEmail()` utility.

### 5.4 Email Notifications
**What:** Auto-alerts for assignment, warranty expiry, overdue returns, approval status.

**How:**
- After each state change (assign, return, request approved), enqueue an email via a lightweight queue (or fire-and-forget `fetch()` to an internal email route).
- Weekly cron-like summary: "Assets with warranty expiring next 30 days", "Overdue returns".
- On the VPS, add a simple scheduled task via host crontab that `curl`s a `/api/cron/...` endpoint.

---

## 6. Access & Security (MEDIUM-TERM)

### 6.1 Multi-Department / Multi-Location
**What:** Scope data so department heads only see their own department.

**How:**
- Add `department` to the `users` table.
- Extend `GET /api/employees`, `GET /api/assets` etc. to filter by `department` when the user is not a super-admin.
- Add a permission table or extend the `role` system:
  ```sql
  CREATE TABLE permissions (
    user_id INTEGER NOT NULL REFERENCES users(id),
    scope TEXT NOT NULL,         -- 'department', 'location', 'global'
    scope_value TEXT,            -- department name or location
    PRIMARY KEY (user_id, scope)
  )
  ```
- Introduce roles: `super_admin`, `department_admin`, `viewer`, `manager`.

### 6.2 Password Change / Profile Page
**What:** Let users update their own name and password.

**How:**
- Add a **Profile** page or dialog (click user name in sidebar).
- Form: current password, new password, confirm new password.
- `PUT /api/auth/me` route with password verification + update.

### 6.3 API Tokens
**What:** Machine-to-machine tokens for integrating with HR systems, IT ticketing tools, or custom scripts.

**How:**
- Create `api_tokens` table:
  ```sql
  CREATE TABLE api_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    last_used_at TEXT,
    expires_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
  ```
- Add **API Tokens** management page under Settings (admin-only).
- `POST /api/auth/tokens` generates a token (display once, store hash).
- `GET /api/auth/me?token=...` for token-based auth.
- Rate-limit token usage.

### 6.4 Session Management
**What:** View and revoke active sessions.

**How:**
- Create a `sessions` table tracking JWT `jti`, user_id, IP, user-agent, created_at, last_activity.
- On login, create a session record and embed `jti` in the JWT.
- On every authenticated request, update `last_activity`.
- Add a **Sessions** page under Settings showing active sessions with "Revoke" button.

---

## 7. Reporting & Analytics (MEDIUM-TERM)

### 7.1 Dashboard Enhancements
**What:** Charts, trends, and richer KPIs.

**How:**
- Add a charting library (Chart.js via `react-chartjs-2` or Recharts).
- Dashboard widgets:
  - **Assets by category** — pie/donut chart.
  - **Assignments over time** — line chart (last 6 months).
  - **Department breakdown** — bar chart of assets per department.
  - **Warranty expiry calendar** — upcoming expirations.
  - **Maintenance overdue** — count of schedules past due.
- Add date range filter to the dashboard.

### 7.2 Custom Reports Builder
**What:** Let admins build custom reports by selecting columns, filters, and grouping.

**How:**
- Create a report builder UI with drag-and-drop column selection.
- Available columns: all fields from assets, employees, assignments, categories.
- Filters: text search, date range, status, department.
- Group by: category, status, department, location.
- Output: table preview + CSV/XLSX/PDF export.

### 7.3 Scheduled Report Delivery
**What:** Auto-generate and email reports on a schedule.

**How:**
- Add a **Report Schedules** page (admin-only).
- UI: select report type, frequency (daily/weekly/monthly), recipients (comma-separated emails).
- `POST /api/reports/schedule` creates a cron-like entry.
- On the VPS, a systemd timer or crontab hits `GET /api/cron/reports` to generate and mail reports.

---

## 8. UX Polish (LONG-TERM)

### 8.1 Dark Mode
**How:**
- Add a `ThemeProvider` using `next-themes` library.
- Persist preference in `localStorage` and respect `prefers-color-scheme`.
- Add a sun/moon toggle button in the sidebar header.
- Ensure all custom CSS and Tailwind classes use `dark:` variants (most already do via shadcn/ui).

### 8.2 Mobile-Responsive Layout
**How:**
- Collapse sidebar into a hamburger menu on screens < 768px.
- Stack table columns into cards on narrow screens (responsive table pattern).
- Make all dialogs full-screen on mobile.
- Optimize form layouts for touch targets (min 44px).

### 8.3 Keyboard Shortcuts
**How:**
- `Ctrl+K` / `Cmd+K` → command palette for quick navigation.
- `N` → new record (in list pages).
- `E` → edit selected row.
- `?` → shortcut help overlay.

### 8.4 Advanced Filtering / Saved Filters
**How:**
- Add multi-criteria filter UI (AND/OR groups).
- "Save Filter" button saves to a `saved_filters` table per user.
- Dropdown to load saved filters.

### 8.5 Activity Feed
**How:**
- A real-time feed on the dashboard showing all recent activity.
- Poll `GET /api/audit-logs?since=X` every 30s (or use SSE).
- Filter by entity type (assets, employees, assignments).

---

## Appendix A: Database Migration Strategy

Since the app uses SQLite with Turso (`@libsql/client`), migrations should be additive:

```typescript
// src/lib/migrate.ts — called after initSchema()
export async function runMigrations() {
  // Track applied migrations in a meta table
  await db.execute(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)

  const applied = await db.execute("SELECT name FROM _migrations")
  const appliedNames = new Set(applied.rows.map((r) => (r as any).name))

  const migrations = [
    { name: "001_maintenance_schedules", sql: `CREATE TABLE IF NOT EXISTS ...` },
    { name: "002_service_logs", sql: `CREATE TABLE IF NOT EXISTS ...` },
    // ...
  ]

  for (const m of migrations) {
    if (appliedNames.has(m.name)) continue
    await db.execute(m.sql)
    await db.execute({ sql: "INSERT INTO _migrations (name) VALUES (?)", args: [m.name] })
  }
}
```

Call `runMigrations()` inside `ensureInitialized()` after `initSchema()`.

## Appendix B: Testing Approach

- **API routes:** Use Next.js route handler tests (Vitest + `fetch` against local server).
- **Database:** Use an in-memory SQLite instance (`":memory:"`) for test isolation.
- **UI components:** Storybook or Vitest with React Testing Library.
- **End-to-end:** Playwright against the staging deployment.

## Appendix C: Deployment Considerations

Each feature should:
1. Be backward-compatible (additive schema changes, optional env vars).
2. Include `is_deleted` / soft-delete pattern on new tables (matching existing conventions).
3. Use the existing auth middleware pattern (dynamic imports of `getAuthUser` + `requireRole`).
4. Follow the current code style: `"use client"` on UI components, `try/catch` with `{ detail: "..." }` in API routes, `toast.error` for user-facing errors.

---

# Business Logic Gaps

*Not UI polish. Not feature requests. Fundamental logic, data integrity, and domain correctness issues that can cause data loss, incorrect state, or audit failures.*

---

## CRITICAL — Data Integrity & Race Conditions

### 1. ID Generation Is Broken Under Concurrency

**Where:** Every create route uses `SELECT COUNT(*)` to compute the next ID:
- `assets/route.ts:60` — `AST-${String(count + 1).padStart(5, "0")}`
- `employees/route.ts:49` — `EMP-${String(count + 1).padStart(4, "0")}`
- `assignments/route.ts:62` — `ASN-${String(count + 1).padStart(5, "0")}`
- `employees/onboard/route.ts:33` — same pattern
- `reports/import/employees/route.ts:49-50` — same
- `reports/import/assets/route.ts:58-59` — same

**Why it's wrong:**
- Two concurrent requests both read `COUNT(*) = 10`, both produce `AST-00011`, second insert violates the UNIQUE constraint and fails with an unhandled 500.
- After soft-deleting 5 assets, `COUNT(*)` returns 5, but IDs `AST-00001` through `AST-00005` already exist. This silently produces IDs that are out of sequence or — if previous IDs were also sequential — no collision yet, but the same count yields different IDs each time you delete records, making the ID non-deterministic and unrepeatable.
- Bulk import processes rows sequentially in a loop with individual `COUNT(*)` calls per row — each row increments the count, producing correct-but-inefficient IDs, but any failure mid-import leaves gaps.

**Fix:** Use a dedicated `id_sequences` table or SQLite `AUTOINCREMENT` exclusively for the display ID, or generate UUIDs (`uuid` is already in package.json dependencies) for `asset_unique_id` and use `AUTOINCREMENT` id as the display ID.

### 2. No Foreign Key Enforcement

**Where:** `src/lib/schema.ts` and all route files.

**Why it's wrong:**
- SQLite does NOT enforce foreign keys by default. You must execute `PRAGMA foreign_keys = ON` per connection.
- The schema defines `REFERENCES asset_categories(id)`, `REFERENCES assets(id)`, `REFERENCES employees(id)` but none of them are enforced.
- This means:
  - An asset can reference a non-existent category.
  - A `DELETE` from `asset_categories` that cascades or restricts is not enforced.
  - An assignment can reference a non-existent asset or employee.
  - The `is_deleted = 1` soft-delete pattern is undermined because foreign key references are never validated.

**Fix:** Add `PRAGMA foreign_keys = ON` after `createClient()` in `db.ts`. Then ensure all deletes handle constraints properly (the current soft-delete approach avoids this, but the constraint should be there for data quality).

### 3. Race Condition on Concurrent Asset Assignment

**Where:** `assignments/route.ts:44-68`

**The sequence:**
1. Request A checks `asset.status = 'Available'` → true
2. Request B checks `asset.status = 'Available'` → true
3. Request A creates assignment, sets `asset.status = 'Assigned'`
4. Request B creates assignment, sets `asset.status = 'Assigned'`
5. Result: one asset assigned to TWO employees. Data is now inconsistent.

**Fix:** Use a transaction with `SELECT ... FOR UPDATE` equivalent (SQLite doesn't support this natively) or use an atomic `UPDATE assets SET status = 'Assigned' WHERE id = ? AND status = 'Available'` and check `changes()` to see if it succeeded. If zero rows affected, the asset was already taken.

### 4. Soft-Delete Orphans Assignments

**Where:** `assets/[id]/route.ts:54` and `employees/[id]/route.ts:74`

**For assets:** Soft-deleting an asset that is currently **Assigned** to an employee does NOT auto-return the assignment. The asset becomes `Inactive`/`is_deleted = 1`, but the `asset_assignments` table still has a row with `assignment_status = 'Assigned'` pointing to a deleted asset. The asset sits in limbo — not active, not returned.

**For employees:** The code DOES auto-return assignments (employee route lines 58-72), but does NOT update the `updated_at` on the affected assets. The `Assets` page lists `a.is_deleted = 0` assets — if an employee was the only one assigned to an asset and gets deleted, the asset's `updated_at` is stale.

**Fix:** For asset deletion, check for active assignments and either block the delete or auto-return them (and update `updated_at` on assets for employee deletes).

---

## HIGH — Incorrect Business Logic

### 5. No Asset Status State Machine

**Where:** `assets/[id]/route.ts:22` — the PUT handler accepts `status` as a free-text field.

**Why it's wrong:** An asset can change from any status to any other status with no validation:
- "Disposed" → "Available" (resurrecting a disposed asset)
- "Assigned" → "Available" without returning through the assignment flow
- "Under Repair" → "Assigned" without a valid assignment record

The only path that should set "Assigned" is the assignment creation flow. The only path that should set "Available" is the return flow. The PUT endpoint should NOT allow changing to/from "Assigned" or "Available" — these must go through the assignment lifecycle.

**Fix:** Define a state machine:
```
Available ──→ Assigned (only via POST /api/assignments)
Assigned  ──→ Available (only via PUT /api/assignments/:id/return)
Available ──→ Under Repair
Under Repair ──→ Available
* ──→ Disposed/Inactive (only via DELETE)
* ──→ Lost
```
Validate transitions in both `PUT /api/assets/:id` and `POST /api/assignments`. Reject invalid transitions with a clear error.

### 6. No Email Validation

**Where:** Every route that accepts email: `employees/route.ts:40`, `onboard/route.ts:12`, `auth/users/route.ts:14`, employee PUT, import routes.

**What's accepted:** `""` (empty), `"not-an-email"`, `"user@", "@domain.com"`, `"a b@c.com"` (spaces).

**Fix:** Validate email format on every input. Use a lightweight regex or a library. Reject with 400 on invalid format.

### 7. No Serial Number Uniqueness

**Where:** `assets` table has `serial_number TEXT` but no UNIQUE constraint and no duplicate check in the create/update routes.

**Why it's wrong:** Serial numbers are manufacturer-assigned unique identifiers. Two assets with the same serial number guarantees confusion during audits, warranty claims, and returns.

**Fix:** Add a UNIQUE constraint on `serial_number` (where not null) in the schema and validate in create/update APIs.

### 8. Future Assignment Dates Allowed

**Where:** `assignments/route.ts:65` — `assigned_date` from user input, no check.

**An assignment can have `assigned_date = 2099-01-01`.** The asset is immediately marked "Assigned" even though the employee doesn't have it yet. This makes the dashboard count of "Assigned" assets inaccurate.

**Fix:** Reject `assigned_date > today` OR add a `scheduled_date` vs `actual_date` distinction so the asset only shows as Assigned once the date arrives.

### 9. No Expected Return Date on Assignments

**Where:** `asset_assignments` schema — only has `assigned_date` and `returned_date`.

**Why it's wrong:** There's no concept of "this asset was lent out and is expected back." You can never generate an "overdue returns" report because there's no expected return date to compare against.

**Fix:** Add `expected_return_date TEXT` to `asset_assignments`. Show overdue assignments in red on the dashboard. Add an "Overdue" report.

### 10. Dashboard Counts Are Misleading

**Where:** `reports/dashboard/route.ts`

**The problem:** The dashboard shows:
- `total_assets` = all non-deleted assets
- `assigned_assets` = those with status 'Assigned'
- `available_assets` = those with status 'Available'

This is only correct if every asset is either Assigned or Available. But what about:
- Assets "Under Repair" — counted in `total_assets` but not in `assigned` or `available`
- Assets "Lost" — same issue (status exists in `statusColor` utility but is never used)
- Assets "Disposed" — not counted (is_deleted = 1), but disposal is different from deletion

The dashboard should explicitly show the breakdown: Total = Available + Assigned + Under Repair + Lost.

**Fix:** Restructure dashboard to show a status breakdown and compute utilization rate: `assigned / (total - under_repair) * 100`.

---

## MEDIUM — Missing Business Rules

### 11. No Password Policy

**Where:** `auth/users/route.ts:14` and `seed.ts`

**Current behavior:** Accepts any string as password, including `""` (empty — though the route requires it, there's no minimum length). Default seed password is `Admin@123` which is reasonable, but an admin could create users with password `"a"`.

**Fix:** Enforce minimum length (8), require at least one uppercase, one lowercase, one digit. Validate on user creation and password change.

### 12. JWT Not Invalidated on Password Change

**Where:** `auth.ts` — tokens have a 60-minute expiry but there's no mechanism to revoke them.

**If an admin resets a user's password**, all existing sessions with the old JWT remain valid until expiry (up to 60 minutes). The user can continue accessing the system with the old password's token.

**Fix:** Maintain a `token_version` column on the `users` table. Include it in the JWT payload. On password change, increment `token_version`. In `getAuthUser()`, verify the JWT's token_version matches the DB. Or use a `sessions` table with a `revoked_at` field.

### 13. No Asset Condition Tracking

**Where:** `assets` table — no condition/grade field.

**Why it's wrong:** An asset can be "Available" but have broken screen, missing keyboard, or cosmetic damage. When it's assigned to the next employee, there's no record of the condition at assignment time. This leads to disputes about who damaged what.

**Fix:** Add `condition TEXT NOT NULL DEFAULT 'Good'` field (New/Good/Fair/Poor/Damaged) to assets. When returning, record the condition in the assignment return process, so you can compare condition_at_assignment vs condition_at_return.

### 14. No Total Cost of Ownership

**Where:** `assets` table has `purchase_cost REAL` but no accumulated cost tracking.

**An asset's true cost includes:** purchase price + repairs + maintenance + accessories. The system only tracks purchase cost.

**Fix:** Add `accumulated_maintenance_cost REAL DEFAULT 0` to assets. When a service log (future) is created with a cost, add it to this field. Display TCO on asset detail.

### 15. No Overdue Detection Anywhere

**Where:** The entire codebase has zero concept of "overdue."

**An assignment is created and never returned.** There's no expected return date (see #9), no reminder, no escalation. Assets that left the building years ago still show as "Assigned" with no flag.

**Fix:** Add `expected_return_date` to assignments. Add `GET /api/assignments/overdue` endpoint. Show overdue count on dashboard. Flag overdue assignments in red in the table.

### 16. Sequential IDs Leak Business Intelligence

**Where:** `AST-00001`, `EMP-0001`, `ASN-00001` patterns.

**A competitor or auditor can infer:** "You've only registered 47 assets" or "You've had 1,230 employees." This is a security/privacy concern for some organizations.

**Fix:** Use UUIDs for external-facing IDs (`asset_unique_id` already exists for this purpose — use it everywhere in the UI instead of `asset_id`). Keep sequential `asset_id` as internal auto-increment only.

### 17. `audit_logs` Table Is Dead Code

**Where:** `schema.ts:80` creates it. No route ever writes to it. It's referenced in backup/export/restore but has 0 rows forever.

**This is an audit/compliance failure.** If any auditor asks "who deleted this asset and when?", there's no answer.

**Fix:** This is already covered in section 1.3 above. It bears repeating because it's a compliance risk, not a missing feature.

### 18. No Warranty Expiry Enforcement

**Where:** `warranty_expiry` is stored but never acted upon.

**Nothing happens when a warranty expires.** The asset continues to show the same status. No notification. No flag on the dashboard. The warranty-expiring report only triggers if someone manually runs it.

**Fix:** Add a `warranty_status` computed field or a daily cron that checks and sets a flag. Show "Warranty Expired" badge on assets past expiry. Block warranty claims on expired warranties.

### 19. Asset Location Desynchronized on Assignment

**Where:** When an asset is assigned to an employee, the `asset_location` field on the asset is NOT updated to match the employee's `office_location`.

**If you have 50 laptops in the Nairobi office and assign one to a Mombasa-based employee**, the asset still shows location "Nairobi" even though it's physically in Mombasa with the employee.

**Fix:** On assignment creation, optionally update `asset.asset_location = employee.office_location` (or let the admin choose to update it). On return, update it back to the pool location.

### 20. `ensureInitialized()` Race Condition

**Where:** `init.ts` uses a module-level `let initialized = false` flag across all requests.

**On a server with multiple instances (Node.js cluster mode, or multiple pods),** each instance has its own `initialized` flag. Both could run `initSchema()` and `seedDefaults()` simultaneously. The table creation is safe (`IF NOT EXISTS`), but the seed INSERT could attempt to insert duplicate users.

**Fix:** Add `INSERT OR IGNORE` to the seed queries, or wrap in a try/catch for UNIQUE constraint violations. Better: use a DB-level initialization check (`SELECT COUNT(*) FROM users`) instead of a process-level boolean.

### 21. Backup Restore Can Create Orphaned Foreign Keys

**Where:** `backups/restore/route.ts` restores tables in a fixed order but does NOT check referential integrity.

**If the backup file has been manually edited or is corrupted,** restoring could create:
- Assets with `category_id` pointing to a non-existent category
- Assignments with `asset_id` pointing to a non-existent asset
- Assignments with `employee_id` pointing to a non-existent employee

**Fix:** Validate referential integrity after restore. Or restore within a transaction and roll back if any foreign key is violated (once `PRAGMA foreign_keys = ON`).

### 22. Duplicate Employee Detection Is Case-Sensitive

**Where:** `employees/route.ts:44` — checks `WHERE email = ?` with exact match.

**`Admin@Company.com` and `admin@company.com` are treated as different employees.** Email addresses are case-insensitive per RFC 5321.

**Fix:** Normalize email to lowercase before storing and comparing. The seed code already does `.toLowerCase()` on viewer emails — the main create route does not.

### 23. No Request Body Size Validation

**Where:** All POST/PUT routes accept `request.json()` without size limits.

**An attacker could send a 1GB JSON body and crash the server** (or exhaust memory). The only size limit is on file uploads (next.config.ts: `bodySizeLimit: "20mb"`), but that only applies to server actions, not route handlers.

**Fix:** Read the `content-length` header and reject requests exceeding a reasonable limit (e.g., 1MB for JSON, 20MB for file uploads).

---

## Summary: What to Fix First

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | ID generation race (`COUNT(*)`) | Low | Duplicate key crashes, data loss |
| P0 | Foreign keys not enforced | Low | Silent data corruption |
| P0 | Concurrent assignment race | Medium | Same asset assigned twice |
| P0 | Audit trail never written | Medium | Zero compliance/accountability |
| P1 | No status state machine | Medium | Assets resurrected from disposed, bypassed assignment flow |
| P1 | No email validation | Low | Garbage data in database |
| P1 | Future assignment dates | Low | Inflated "currently assigned" counts |
| P1 | No expected return date | Low | Can't detect overdue returns |
| P2 | JWT not invalidatable | Medium | Password change doesn't terminate sessions |
| P2 | No password policy | Low | Weak/default passwords |
| P2 | Serial numbers not unique | Low | Asset confusion during audits |
| P2 | Asset condition not tracked | Medium | Damage disputes |
| P2 | Dashboard counts misleading | Low | Wrong KPIs shown to management |
| P3 | Case-sensitive email duplicates | Low | Duplicate employee records |
| P3 | Location not synced on assign | Low | Asset location becomes stale |
| P3 | Init race on multi-instance | Low | Duplicate seed users |
| P3 | Sequential ID leaks info | Low | Privacy concern |
| P4 | No request size limits | Low | Memory exhaustion risk |
| P4 | Backup restore no validation | Medium | Orphaned records after restore |

---

*This document is a living roadmap. Prioritize based on user feedback and organizational needs.*
