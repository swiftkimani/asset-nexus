<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/swiftkimani/asset-nexus/main/public/nexus-banner-dark.svg">
  <img alt="Asset Nexus Banner" src="https://raw.githubusercontent.com/swiftkimani/asset-nexus/main/public/nexus-banner-light.svg">
</picture>

<h1 align="center">Asset Nexus</h1>

<p align="center">
  <strong>Enterprise-Grade Asset Lifecycle Management System</strong>
  <br />
  Track, assign, procure, maintain, and report on your organization's assets
  <br />
  with surgical precision — from a single pane of glass.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-security">Security</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" />
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/SQLite-Turso-003B57" alt="SQLite via Turso" />
  <img src="https://img.shields.io/badge/shadcn/ui-latest-000000" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4" alt="Tailwind CSS v4" />
</p>

<br />

---

## Overview

**Asset Nexus** transforms the chaos of spreadsheet-based asset tracking into a streamlined, auditable, enterprise-grade operation. It replaces manual Excel sheets and fragmented email chains with a centralized platform where:

- **IT Teams** provision, assign, maintain, and decommission assets in one click
- **Managers** get real-time visibility into asset utilization, costs, and depreciation
- **Auditors** access a complete, immutable trail of every asset's journey
- **Finance** tracks depreciation, TCO, procurement budgets, and warranty claims
- **Employees** request assets, view their assignments, and receive notifications

Whether you're managing 50 laptops or 5,000 devices across multiple offices, Asset Nexus scales with your organization.

---

## Features

### 📦 Asset Lifecycle Management
| Capability | Description |
|---|---|
| **Full CRUD** | Create, read, update, and soft-delete assets with rich metadata |
| **Unique Identification** | Auto-generated asset IDs plus custom unique IDs |
| **Categorization** | Dynamic categories with lazy creation |
| **Status State Machine** | Enforced transitions: Available→Assigned→Under Repair→Inactive/Lost/Disposed |
| **Condition Tracking** | New / Good / Fair / Poor / Damaged with bulk updates |
| **Warranty Management** | Track expiry, file claims (blocked after expiry), "Expired" badge |
| **Depreciation** | Straight-line calculation with configurable useful life & salvage value |
| **Total Cost of Ownership** | Purchase cost + accumulated maintenance cost displayed per asset |
| **QR Code Labels** | Generate PNG QR codes per asset for physical tagging and scanning |
| **Multi-Label Sheets** | Print 3-column grid sheets with QR labels for bulk physical tagging |
| **QR Scan Page** | `/scan` page with live camera capture or image upload; server-side QR decode via jimp+jsQR |
| **Bulk Operations** | Deactivate, mark repair, update location, set condition on multiple assets |
| **Asset Detail Page** | Full detail view with History Timeline, Warranty, Service, Maintenance, and Disposal tabs |

### 👥 Employee Management
| Capability | Description |
|---|---|
| **Employee Directory** | Centralized records with designation, department, location, and reporting hierarchy |
| **Employment Status** | Active / Inactive tracking with soft-delete protection |
| **Onboarding** | One-shot employee creation with optional asset assignments |
| **Offboarding** | Automated return of all assigned assets; single-click deprovisioning |
| **Bulk Import** | Upload employee records via XLSX spreadsheets |

### 🔗 Assignment Engine
| Capability | Description |
|---|---|
| **Assign & Return** | Two-click asset assignment and return workflows |
| **Transfer** | Reassign directly between employees without return cycle |
| **Overdue Detection** | Expected return dates with overdue query and dashboard flagging |
| **Assignment History** | Complete audit trail of every assignment event |
| **Race-Safe Assignment** | Atomic status update prevents double-booking |
| **Location Sync** | Asset location auto-updated to employee's office on assignment |

### 🔧 Maintenance & Service
| Capability | Description |
|---|---|
| **Service Logs** | Track repairs: issue, vendor, cost, resolution, downtime |
| **Maintenance Schedules** | Recurring schedules with frequency, last/next due dates |
| **Warranty Claims** | Claim number, RMA, vendor contact, status tracking |
| **Disposal/Retirement** | Log disposal method, reason, authorization for retired assets |

### 📊 Reporting & Analytics
| Capability | Description |
|---|---|
| **Dashboard** | Live counts: employees, assets, assigned, available, under repair, lost, disposed, inactive; utilization rate |
| **Status Breakdown** | Complete pie-chart data for every asset status |
| **Charts** | Assets by category (donut), assignments by month (bar), department assets (bar) — pure SVG |
| **Dashboard Widgets** | Upcoming Maintenance, Warranty Expiring, Pending Requests cards in 3-column grid below charts |
| **Report Library** | 5 report types: recent assignments, assets-by-employee, unassigned assets, under repair, warranty-expiring |
| **Custom Reports Builder** | Column multi-select with CSV export |
| **Scheduled Reports** | Auto-generate and email reports on cron schedule with per-user configuration |
| **Export** | CSV and XLSX export for every entity and report |
| **Import** | Bulk asset and employee creation from XLSX uploads |
| **Saved Filters** | Save/load named filter presets per entity |
| **Activity Feed** | Real-time feed on dashboard polling audit logs every 30s |

### 🛒 Procurement
| Capability | Description |
|---|---|
| **Purchase Orders** | Track POs with vendor, amount, status, and approval |
| **Vendor Directory** | Centralized vendor list with contact info, rating, and status |
| **Procurement UI** | Dedicated pages under Procurement nav section |

### 📋 Asset Requests & Approvals
| Capability | Description |
|---|---|
| **Request Workflow** | Employees submit requests → Admin approves/rejects |
| **My Requests / All Requests** | Toggle between personal and admin views |
| **Approval Actions** | Approve/reject with review notes and auto-notification |
| **Pending Requests Badge** | Unseen requests count for admins |

### 🔔 Notifications
| Capability | Description |
|---|---|
| **In-App Bell** | Bell icon with unread count badge and dropdown panel |
| **Polling** | Unread count polls every 30s |
| **Email Alerts** | Nodemailer integration with configurable SMTP; test endpoint |
| **Event Triggers** | Assignment, return, request approval events create notifications |

### 🔐 Access & Security
| Capability | Description |
|---|---|
| **JWT Authentication** | httpOnly cookie-based tokens with configurable expiry |
| **Password Hashing** | bcrypt with 12 salt rounds |
| **Role-Based Access Control** | `admin` (full access) and `viewer` (read-only) roles |
| **OAuth/SSO** | Google Workspace + Microsoft Entra ID login with auto-provisioned viewer accounts |
| **Multi-Tenancy** | Organization-scoped data isolation via `org_id` on users table |
| **Multi-Department Scoping** | Users with a department see only their department's data |
| **API Tokens** | Generate/revoke machine-to-machine tokens (bcrypt-hashed) |
| **Session Invalidation** | `token_version` in JWT — password change revokes all sessions |
| **Password Policy** | 8+ chars, uppercase, lowercase, digit — enforced on create & change |
| **Profile Management** | Users can change their own name and password |

### 🎨 UX
| Capability | Description |
|---|---|
| **Dark Mode** | System-preference detection with manual toggle; persisted to localStorage |
| **Mobile Responsive** | Collapsible sidebar → bottom nav on mobile; responsive tables |
| **PWA** | Progressive Web App with manifest, standalone display, SVG icon — installable on mobile/desktop |
| **Keyboard Shortcuts** | `Ctrl/Cmd+K` opens command palette for quick navigation |
| **Loading States** | Skeleton loaders, empty states, proper error boundaries |
| **Confirmation Dialogs** | AlertDialog-based confirmations replacing `confirm()` |

### 💾 Backup & Recovery
| Capability | Description |
|---|---|
| **Full Export** | Complete database dump as structured JSON |
| **Transactional Restore** | Atomic replace/merge with rollback on failure |
| **Table Summary** | Row counts per table for quick health checks |
| **Audit Logs** | Immutable action log for compliance and troubleshooting |

### 🔌 Integrations & APIs
| Capability | Description |
|---|---|
| **REST API** | 60+ endpoints covering every entity, action, and report |
| **GraphQL API** | `GET/POST /api/graphql` with 6 query types using graphql-yoga + @graphql-tools/schema |
| **OAuth/SSO** | Google Workspace and Microsoft Entra ID as identity providers |
| **Bulk Import** | XLSX-based employee and asset bulk import |
| **Scheduled Reports** | Cron endpoint for auto-generating and emailing reports |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / Client                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Dashboard   │  │   Employees  │  │    Assets    │   │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤   │
│  │  Assignments  │  │   Requests   │  │ Procurement   │   │
│  ├──────────────┤  ├──────────────┤  └──────────────┘   │
│  │    Reports    │  │   Settings   │                     │
│  └──────┬───────┘  └──────┬───────┘                     │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js 16 App Router (Server)               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              API Routes (60+ endpoints)              │  │
│  │  /api/auth/*  /api/assets/*  /api/employees/*        │  │
│  │  /api/assignments/*  /api/reports/*  /api/backups/*  │  │
│  │  /api/requests/*  /api/notifications/*  /api/scan    │  │
│  │  /api/purchase-orders/*  /api/vendors/*              │  │
│  │  /api/filters/*  /api/email/*  /api/graphql          │  │
│  │  /api/cron/*  /api/maintenance/*                     │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Auth Layer (JWT + bcrypt)                   │  │
│  │    middleware: cookie → verifyToken → requireRole    │  │
│  │    + token_version + org_id + department scoping     │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Database Layer (@libsql/client)             │  │
│  │        Pooled SQL queries with parameterization       │  │
│  │        + FOREIGN KEY enforcement + transactions       │  │
│  └──────────────────────┬──────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Store                             │
│  ┌─────────────────┐  ┌──────────────────────────────┐   │
│  │  Local SQLite    │  │  Turso (Distributed SQLite)   │   │
│  │  (development)   │  │  (production / multi-region)  │   │
│  └─────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘

Schema (17 tables):
  users ────────────┐
  employees ────────┤
  assets ───────────┤
  asset_categories ─┤
  asset_assignments ┤
  audit_logs ───────┤
  warranty_claims ──┤
  service_logs ─────┤
  maintenance_schedules
  disposal_logs ────┤
  purchase_orders ──┤
  vendors ──────────┤
  asset_requests ───┤
  notifications ────┤
  api_tokens ───────┤
  saved_filters ────┤
  report_schedules ─┘
```

### Data Flow

1. **Client** makes a request to an API route
2. **Next.js App Router** resolves the route handler
3. **Auth layer** extracts JWT from httpOnly cookie, verifies signature, expiry, and `token_version`; checks role
4. **Department scoping** appends filters for non-admin users with restricted departments
5. **Handler** constructs a parameterized SQL query with filters, pagination, joins
6. **@libsql/client** executes the query against SQLite (local or Turso remote) with `PRAGMA foreign_keys = ON`
7. **Mutation endpoints** write to `audit_logs` and trigger notifications
8. **Response** is returned as JSON to the client
9. **React component** renders the data in a table/card/dashboard widget

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework with server components |
| **Language** | TypeScript 5 (strict mode) | Type safety across the entire codebase |
| **Database** | SQLite via Turso / @libsql/client | Zero-config local dev; distributed SQLite for production |
| **ORM** | Raw SQL with parameterized queries | Full control, minimal overhead, explicit query plans |
| **Auth** | jsonwebtoken + bcryptjs | JWT in httpOnly cookies; bcrypt with 12 salt rounds |
| **UI** | shadcn/ui + Radix Primitives | Accessible, composable, unstyled component primitives |
| **Styling** | Tailwind CSS v4 + CSS variables | Utility-first with OKLCH color space and dark mode |
| **Icons** | Lucide React | Consistent, tree-shakeable icon set |
| **Fonts** | Geist (Vercel) | Modern, optimized font family |
| **Charts** | Pure SVG | Custom donut, bar, and horizontal bar charts (no dependencies) |
| **QR** | qrcode + jimp + jsQR | Server-side PNG generation & barcode decoding for asset labels |
| **GraphQL** | graphql-yoga + @graphql-tools/schema | Flexible query API as alternative to REST |
| **OAuth** | googleapis + jose | SSO with Google and Microsoft identity providers |
| **Email** | nodemailer | SMTP-based email notifications |
| **Export** | ExcelJS | XLSX generation and parsing for reports/imports |
| **Container** | Docker (multi-stage) | Alpine-based, production-optimized container image |
| **Deployment** | Any Node.js host | Vercel, Render, Railway, self-hosted, or Docker |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm (or pnpm, yarn, bun)

### Local Development

```bash
# Clone the repository
git clone https://github.com/swiftkimani/asset-nexus.git
cd asset-nexus

# Install dependencies
npm install

# Configure environment (optional — defaults work out of the box)
cp .env.example .env

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the default admin credentials.

### Default Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@company.com` | `Admin@123` |
| **Viewer** | `ceo@company.com` | `Viewer@123` |
| **Viewer** | `hr@company.com` | `Viewer@123` |
| **Viewer** | `accounts@company.com` | `Viewer@123` |

> **Security:** Change these immediately in any production deployment. Set `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_VIEWER_EMAILS`, and `DEFAULT_VIEWER_PASSWORD` in your environment.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | `file:./asset_tracker.db` | Database URL. Use `libsql://` for Turso remote |
| `TURSO_AUTH_TOKEN` | — | Turso authentication token (not needed for local) |
| `SECRET_KEY` | `change-this-to-a-random-secret-key` | JWT signing secret — **change in production** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | JWT token expiry in minutes |
| `DEFAULT_ADMIN_NAME` | `IT Admin` | Admin display name for seed |
| `DEFAULT_ADMIN_EMAIL` | `admin@company.com` | Admin email for seed |
| `DEFAULT_ADMIN_PASSWORD` | `Admin@123` | Admin password for seed |
| `DEFAULT_VIEWER_EMAILS` | `ceo@company.com,hr@company.com,accounts@company.com` | Comma-separated viewer emails |
| `DEFAULT_VIEWER_PASSWORD` | `Viewer@123` | Shared viewer password |
| `SMTP_HOST` | — | SMTP server for email notifications |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | `noreply@assetnexus.com` | From address for outgoing emails |

### Docker

```bash
docker compose up --build
```

The application will be available at [http://localhost:3000](http://localhost:3000) with a persistent volume for the SQLite database.

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Sign in, returns JWT as httpOnly cookie |
| `POST` | `/api/auth/logout` | — | Clear session cookie |
| `GET` | `/api/auth/me` | — | Get current authenticated user |
| `PUT` | `/api/auth/me` | Auth | Update profile / change password |
| `POST` | `/api/auth/users` | Admin | Create a new user |
| `GET` | `/api/auth/users` | Admin | List all users |
| `PUT` | `/api/auth/users/{id}` | Admin | Update user name/role |
| `DELETE` | `/api/auth/users/{id}` | Admin | Delete a user |
| `GET` | `/api/auth/tokens` | Admin | List API tokens |
| `POST` | `/api/auth/tokens` | Admin | Generate a new API token (displayed once) |
| `DELETE` | `/api/auth/tokens/{id}` | Admin | Revoke an API token |
| `GET` | `/api/auth/oauth/[provider]` | — | Initiate OAuth flow (Google or Microsoft) |
| `GET` | `/api/auth/oauth/callback/[provider]` | — | OAuth callback handler (code exchange, auto-provision) |

### Assets

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/assets` | Admin, Viewer | List/filter assets (`?search=&category=&status=&assigned_employee=&skip=&limit=`) |
| `POST` | `/api/assets` | Admin | Create a new asset |
| `PUT` | `/api/assets/{id}` | Admin | Update an asset (validates status state machine) |
| `DELETE` | `/api/assets/{id}` | Admin | Soft-delete (auto-returns active assignments) |
| `GET` | `/api/assets/categories` | Admin, Viewer | List all asset categories |
| `GET` | `/api/assets/export` | Admin, Viewer | Export assets as CSV or XLSX (`?fmt=csv\|xlsx`) |
| `POST` | `/api/assets/bulk` | Admin | Bulk deactivate / mark_repair / update_location / set_condition |
| `GET` | `/api/assets/{id}/history` | Admin, Viewer | Get asset history timeline |
| `GET` | `/api/assets/{id}/qr` | — | Generate QR code PNG for asset label |
| `GET` | `/api/assets/qr-sheet` | Admin | Generate print-friendly multi-label QR sheet (`?ids=1,2,3`) |
| `GET` | `/api/assets/warranty-expiring` | Admin, Viewer | List assets with warranty expiring within 30 days |
| `GET` | `/api/assets/{id}/warranty` | Admin, Viewer | List warranty claims |
| `POST` | `/api/assets/{id}/warranty` | Admin | File a warranty claim (blocked if expired) |
| `GET` | `/api/assets/{id}/service` | Admin, Viewer | List service logs |
| `POST` | `/api/assets/{id}/service` | Admin | Create service log |
| `GET` | `/api/assets/{id}/maintenance` | Admin, Viewer | List maintenance schedules |
| `POST` | `/api/assets/{id}/maintenance` | Admin | Create maintenance schedule |
| `POST` | `/api/assets/{id}/dispose` | Admin | Dispose an asset |

### Employees

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/employees` | Admin, Viewer | List/filter employees (`?search=&designation=&department=&skip=&limit=`) |
| `POST` | `/api/employees` | Admin | Create a new employee |
| `GET` | `/api/employees/{id}` | Admin, Viewer | Get employee details |
| `PUT` | `/api/employees/{id}` | Admin | Update an employee |
| `DELETE` | `/api/employees/{id}` | Admin | Soft-delete an employee (auto-returns assignments) |
| `POST` | `/api/employees/onboard` | Admin | Create employee + assign assets (one-shot) |
| `POST` | `/api/employees/offboard` | Admin | Offboard employee, return all assets |
| `GET` | `/api/employees/export` | Admin, Viewer | Export employees as CSV or XLSX |

### Assignments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/assignments` | Admin, Viewer | List/filter assignments (`?status=&asset_id=&employee_id=&skip=&limit=`) |
| `POST` | `/api/assignments` | Admin | Assign an asset to an employee (race-safe, syncs location) |
| `PUT` | `/api/assignments/{id}/return` | Admin | Mark an asset as returned |
| `POST` | `/api/assignments/{id}/transfer` | Admin | Transfer asset directly to another employee |
| `GET` | `/api/assignments/overdue` | Admin, Viewer | List overdue assignments (past expected_return_date) |

### Requests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/requests` | Admin, Viewer | List asset requests (`?status=&skip=&limit=`) |
| `POST` | `/api/requests` | Auth | Submit a new asset request |
| `PUT` | `/api/requests/{id}` | Admin | Approve or reject a request (creates notification) |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Auth | List notifications (50 newest) |
| `POST` | `/api/notifications` | Auth | Mark all as read |
| `GET` | `/api/notifications/unread-count` | Auth | Get unread notification count |

### Procurement

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/purchase-orders` | Admin, Viewer | List POs (`?search=&skip=&limit=`) |
| `POST` | `/api/purchase-orders` | Admin | Create a purchase order |
| `GET` | `/api/vendors` | Admin, Viewer | List vendors |
| `POST` | `/api/vendors` | Admin | Create a vendor |
| `GET` | `/api/vendors/{id}` | Admin, Viewer | Get vendor details |
| `PUT` | `/api/vendors/{id}` | Admin | Update vendor |
| `DELETE` | `/api/vendors/{id}` | Admin | Soft-delete vendor |

### Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reports` | Admin, Viewer | Generate reports (`?name=...&limit=&format=csv\|xlsx`) |
| `GET` | `/api/reports/dashboard` | Admin, Viewer | Dashboard statistics with status breakdown |
| `GET` | `/api/reports/custom` | Admin, Viewer | Custom report with selected columns (`?columns=a,b,c`) |
| `POST` | `/api/reports/schedule` | Admin | Create/update a scheduled report configuration |
| `DELETE` | `/api/reports/schedule` | Admin | Delete a scheduled report configuration |
| `POST` | `/api/reports/import/employees` | Admin | Bulk import employees from XLSX |
| `POST` | `/api/reports/import/assets` | Admin | Bulk import assets from XLSX |

### Scheduled Reports (Cron)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cron/reports` | — | Generate and email due reports (invoke via cron job) |

### Maintenance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/maintenance/upcoming` | Admin, Viewer | List maintenance due within 30 days |

### GraphQL

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/graphql` | Admin, Viewer | GraphQL query interface (GET with query param) |
| `POST` | `/api/graphql` | Admin, Viewer | GraphQL query interface (POST with JSON body) |

### Scan

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/scan` | — | Decode QR code from uploaded image (jimp + jsQR) |

### Filters

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/filters` | Auth | List saved filters (`?entity=assets`) |
| `POST` | `/api/filters` | Auth | Save a filter |
| `DELETE` | `/api/filters/{id}` | Auth | Delete a saved filter |

### Backups

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/backups` | Admin | Get table row counts |
| `GET` | `/api/backups/export` | Admin | Export full database as JSON |
| `POST` | `/api/backups/restore?mode=replace\|merge` | Admin | Restore database from JSON (transactional) |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/init` | — | Initialize database schema and seed default users |
| `POST` | `/api/email/test` | Admin | Send a test email via configured SMTP |

---

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fswiftkimani%2Fasset-nexus)

1. Push this repository to GitHub
2. Import into Vercel
3. Set environment variables in Vercel dashboard
4. For production, use a Turso remote database instead of local SQLite

### Docker / Self-Hosted

```bash
# Build and run with Docker
docker compose up --build -d

# Or build and run manually
docker build -t asset-nexus .
docker run -d -p 3000:3000 \
  -e TURSO_DATABASE_URL=file:/data/asset_tracker.db \
  -e SECRET_KEY=your-strong-secret-key \
  -v asset-nexus-data:/data \
  asset-nexus
```

### Turso (Production Database)

For production, replace the local SQLite file with [Turso](https://turso.tech/) — a distributed, edge-ready SQLite database:

```bash
# Install Turso CLI and create a database
brew install tursodatabase/tap/turso
turso auth login
turso db create asset-nexus-prod
turso db show asset-nexus-prod --url

# Set environment variables
TURSO_DATABASE_URL=libsql://asset-nexus-prod.turso.io
TURSO_AUTH_TOKEN=your-turso-token
```

---

## Security

| Practice | Implementation |
|---|---|
| **Password Storage** | bcrypt with 12 salt rounds — computationally expensive, resistant to GPU-based attacks |
| **Password Policy** | Enforces 8+ chars, uppercase, lowercase, digit on creation and change |
| **Session Tokens** | JWT stored in httpOnly, same-site cookies — inaccessible to JavaScript, immune to XSS token theft |
| **Session Invalidation** | `token_version` in JWT payload; incrementing it on password change invalidates all existing sessions |
| **Role Enforcement** | Server-side `requireRole()` on every API handler — not client-side gates |
| **SQL Injection** | All queries use parameterized statements via `@libsql/client` — no string interpolation |
| **Foreign Key Enforcement** | `PRAGMA foreign_keys = ON` on every database connection |
| **Soft Delete** | `is_deleted` flag preserves referential integrity; auto-returns active assignments |
| **Input Validation** | Email format validation, password policy, body size limits (1MB JSON / 20MB uploads) |
| **Serial Uniqueness** | Duplicate serial numbers rejected at the API level |
| **Status State Machine** | Invalid status transitions blocked server-side |
| **Race Condition Protection** | Atomic `UPDATE ... WHERE status='Available'` prevents concurrent double-assignment |
| **Transaction Safety** | Backup restore wrapped in `BEGIN/COMMIT/ROLLBACK` |
| **Rate Limiting** | API pagination capped at 200 / 300 rows; file upload limited to 20 MB via Next.js config |
| **CORS** | Not applicable — API and client are served from the same Next.js origin |

---

## Project Structure

```
asset-nexus/
├── src/
│   ├── app/
│   │   ├── api/                  # REST API routes (60+ endpoints)
│   │   │   ├── auth/             # login, logout, me, users, tokens, oauth
│   │   │   ├── assets/           # CRUD, bulk, categories, export, qr, qr-sheet, history, warranty, service, maintenance, dispose
│   │   │   ├── employees/        # CRUD, export, onboard, offboard
│   │   │   ├── assignments/      # list/create, return, transfer, overdue
│   │   │   ├── requests/         # asset request workflow
│   │   │   ├── notifications/    # in-app notifications, unread-count
│   │   │   ├── purchase-orders/  # procurement
│   │   │   ├── vendors/          # vendor directory
│   │   │   ├── filters/          # saved filters
│   │   │   ├── reports/          # reports, dashboard, custom, import, schedule
│   │   │   ├── backups/          # export/restore
│   │   │   ├── email/            # test email
│   │   │   ├── scan/             # QR decode endpoint
│   │   │   ├── graphql/          # GraphQL API
│   │   │   ├── cron/             # scheduled reports cron trigger
│   │   │   ├── maintenance/      # upcoming maintenance queries
│   │   │   └── init/             # schema + seed
│   │   ├── (app)/                # Authenticated page routes
│   │   │   ├── dashboard/
│   │   │   ├── employees/
│   │   │   ├── assets/           # list + [id]/ detail page
│   │   │   ├── assignments/
│   │   │   ├── requests/
│   │   │   ├── procurement/      # purchase-orders + vendors
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── scan/             # QR scan page (camera + upload)
│   │   ├── layout.tsx            # Root layout + AuthProvider
│   │   ├── page.tsx              # Login page
│   │   └── globals.css           # Tailwind v4 + theme variables
│   ├── components/
│   │   ├── auth-provider.tsx     # Client-side auth context
│   │   ├── nav-sidebar.tsx       # App navigation sidebar
│   │   ├── mobile-nav.tsx        # Mobile bottom navigation
│   │   ├── notification-bell.tsx # In-app notification dropdown
│   │   ├── command-palette.tsx   # Ctrl+K quick nav
│   │   ├── keyboard-shortcuts.tsx# Keyboard shortcut hook
│   │   ├── theme-provider.tsx    # Dark/light mode provider
│   │   └── ui/                   # shadcn/ui primitives
│   ├── lib/
│   │   ├── auth.ts               # JWT + bcrypt helpers + token_version + org_id
│   │   ├── db.ts                 # Database client (Turso/SQLite) + FK enforcement
│   │   ├── schema.ts             # Table DDL (17 tables)
│   │   ├── seed.ts               # Default user + sample data seeder
│   │   ├── init.ts               # DB-level initialization guard
│   │   ├── audit.ts              # Audit log helper
│   │   ├── email.ts              # Nodemailer email sender
│   │   ├── oauth.ts              # OAuth provider config (Google + Microsoft)
│   │   ├── org-scope.ts          # Multi-tenancy org_id filter helper
│   │   ├── id-gen.ts             # Atomic display ID generation
│   │   ├── graphql/              # GraphQL schema + resolvers
│   │   │   ├── schema.ts         # Type definitions
│   │   │   └── resolvers.ts      # Query resolvers
│   │   └── utils.ts              # cn(), formatDate(), formatCurrency(), statusColor(), validatePassword(), validateEmail(), validateBodySize(), straightLineDepreciation()
│   └── types/
│       └── index.ts              # TypeScript interfaces for all entities
├── public/                       # Static assets
├── docker-compose.yml            # Docker Compose configuration
├── Dockerfile                    # Multi-stage production build
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── components.json               # shadcn/ui configuration
├── package.json
└── .env.example                  # Environment variable template
```

---

## Development

### Lint

```bash
npm run lint
```

### Build

```bash
npm run build
```

### Production Start

```bash
npm run start
```

---

## Roadmap

- [x] **QR Code Labels** — Print and scan QR codes for rapid asset identification
- [x] **Email Notifications** — Automated alerts via nodemailer with configurable SMTP
- [x] **Depreciation Schedules** — Straight-line asset value depreciation calculations
- [x] **Audit Trail UI** — Activity feed on dashboard; searchable audit logs
- [x] **Dark Mode** — System-preference detection with manual toggle
- [x] **Mobile-Responsive Layout** — Collapsible sidebar, bottom nav, responsive tables
- [x] **Keyboard Shortcuts** — Command palette, quick navigation
- [x] **Saved Filters** — Per-user filter presets
- [x] **Custom Reports** — Column-select builder with CSV export
- [x] **Procurement Module** — Purchase orders and vendor directory
- [x] **Asset Requests & Approvals** — Request workflow with approve/reject
- [x] **In-App Notifications** — Bell icon with dropdown and polling
- [x] **API Tokens** — Machine-to-machine token generation
- [x] **Session Management** — Token version invalidation
- [x] **Multi-Department Scoping** — Department-level data isolation
- [x] **OAuth/SSO** — Single sign-on with Google Workspace, Microsoft Entra ID
- [x] **PWA** — Progressive Web App with manifest and standalone display
- [x] **Multi-Tenancy** — Organization-scoped data isolation via org_id
- [x] **GraphQL API** — Alternative to REST for flexible queries
- [x] **Scheduled Reports** — Auto-generate and email reports on a schedule
- [ ] **Native Mobile App** — React Native or Flutter companion app
- [ ] **Barcode / RFID** — Additional scanning methods beyond QR
- [ ] **CI/CD Pipeline** — Automated testing and deployment

---

## Contributing

Contributions are welcome and appreciated. Please open an issue first to discuss the change, then submit a pull request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/swiftkimani">Kim</a>
  <br />
  <sub>Asset Nexus — Because your assets deserve more than a spreadsheet.</sub>
</p>
