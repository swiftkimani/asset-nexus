<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/swiftkimani/asset-nexus/main/public/nexus-banner-dark.svg">
  <img alt="Asset Nexus Banner" src="https://raw.githubusercontent.com/swiftkimani/asset-nexus/main/public/nexus-banner-light.svg">
</picture>

<h1 align="center">Asset Nexus</h1>

<p align="center">
  <strong>Enterprise-Grade Asset Lifecycle Management System</strong>
  <br />
  Track, assign, report, and manage your organization's hardware &amp; software assets
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
  <img src="https://img.shields.io/badge/Next.js-15-black" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/SQLite-Turso-003B57" alt="SQLite via Turso" />
  <img src="https://img.shields.io/badge/shadcn/ui-latest-000000" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4" alt="Tailwind CSS v4" />
</p>

<br />

---

## Overview

**Asset Nexus** transforms the chaos of spreadsheet-based asset tracking into a streamlined, auditable, enterprise-grade operation. It replaces manual Excel sheets and fragmented email chains with a centralized platform where:

- **IT Teams** provision, assign, and decommission assets in one click
- **Managers** get real-time visibility into asset utilization and costs
- **Auditors** access a complete, immutable trail of every asset's journey
- **Finance** tracks depreciation, warranty expiry, and procurement costs

Whether you're managing 50 laptops or 5,000 devices across multiple offices, Asset Nexus scales with your organization.

---

## Features

### 📦 Asset Lifecycle Management
| Capability | Description |
|---|---|
| **Full CRUD** | Create, read, update, and soft-delete assets with rich metadata |
| **Unique Identification** | Auto-generated asset IDs (`AST-00001`) plus custom unique IDs |
| **Categorization** | Dynamic categories with lazy creation on assignment |
| **Status Tracking** | Available, Assigned, Under Repair, Lost — with visual badges |
| **Warranty Management** | Track purchase costs, warranty expiry dates, and vendors |
| **Bulk Operations** | Deactivate/reactivate assets in bulk with soft-delete safety |

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
| **Assignment History** | Complete audit trail of every assignment event |
| **Status Enforcement** | Cannot assign already-assigned or unavailable assets |
| **Notes** | Contextual notes on every assignment for full traceability |

### 📊 Reporting & Analytics
| Capability | Description |
|---|---|
| **Dashboard** | Live counts: total employees, total assets, assigned, available, under repair |
| **Recent Assignments** | Last 10 assignment events displayed on the dashboard |
| **Report Library** | 5 report types: recent assignments, assets-by-employee, unassigned assets, under repair, warranty-expiring |
| **Export** | CSV and XLSX export for every entity and report |
| **Import** | Bulk employee and asset creation from XLSX uploads |

### 💾 Backup & Recovery
| Capability | Description |
|---|---|
| **Full Export** | Complete database dump as structured JSON |
| **Restore** | Replace or merge mode for recovery scenarios |
| **Table Summary** | Row counts per table for quick health checks |
| **Audit Logs** | Immutable action log for compliance and troubleshooting |

### 🔐 Security
| Capability | Description |
|---|---|
| **JWT Authentication** | httpOnly cookie-based tokens with configurable expiry |
| **Password Hashing** | bcrypt with 12 salt rounds |
| **Role-Based Access Control** | `admin` (full access) and `viewer` (read-only) roles |
| **Protected Routes** | Server-side auth enforcement on every API endpoint |
| **Input Validation** | Server-side validation for all mutations |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / Client                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Dashboard   │  │   Employees  │  │    Assets    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Assignments  │  │   Reports    │  │  Login/Auth   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js 15 App Router (Server)               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              API Routes (REST)                       │  │
│  │  /api/auth/*  /api/assets/*  /api/employees/*        │  │
│  │  /api/assignments/*  /api/reports/*  /api/backups/*  │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Auth Layer (JWT + bcrypt)                   │  │
│  │    middleware: cookie → verifyToken → requireRole    │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Database Layer (@libsql/client)             │  │
│  │        Pooled SQL queries with parameterization       │  │
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

Schema (6 tables):
  users ────────────┐
  employees ────────┤
  assets ───────────┤
  asset_categories ─┤
  asset_assignments ┤
  audit_logs ───────┘
```

### Data Flow

1. **Client** makes a request to an API route (e.g., `GET /api/assets?search=laptop`)
2. **Next.js App Router** resolves the route handler
3. **Auth middleware** extracts JWT from httpOnly cookie, verifies signature & expiry, checks role
4. **Handler** constructs a parameterized SQL query with filters, pagination, joins
5. **@libsql/client** executes the query against SQLite (local or Turso remote)
6. **Response** is returned as JSON to the client
7. **React component** renders the data in a table/card/dashboard widget

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Full-stack React framework with server components |
| **Language** | TypeScript 5 (strict mode) | Type safety across the entire codebase |
| **Database** | SQLite via Turso / @libsql/client | Zero-config local dev; distributed SQLite for production |
| **ORM** | Raw SQL with parameterized queries | Full control, minimal overhead, explicit query plans |
| **Auth** | jsonwebtoken + bcryptjs | JWT in httpOnly cookies; bcrypt with 12 salt rounds |
| **UI** | shadcn/ui + Radix Primitives | Accessible, composable, unstyled component primitives |
| **Styling** | Tailwind CSS v4 + CSS variables | Utility-first with OKLCH color space and dark mode |
| **Icons** | Lucide React | Consistent, tree-shakeable icon set |
| **Fonts** | Geist (Vercel) | Modern, optimized font family |
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
| `POST` | `/api/auth/users` | Admin | Create a new user |

### Assets

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/assets` | Admin, Viewer | List/filter assets (`?search=&category=&status=&assigned_employee=&skip=&limit=`) |
| `POST` | `/api/assets` | Admin | Create a new asset |
| `PUT` | `/api/assets/{id}` | Admin | Update an asset |
| `DELETE` | `/api/assets/{id}` | Admin | Soft-delete (deactivate) an asset |
| `GET` | `/api/assets/categories` | Admin, Viewer | List all asset categories |
| `GET` | `/api/assets/export` | Admin, Viewer | Export assets as CSV or XLSX (`?format=csv\|xlsx`) |

### Employees

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/employees` | Admin, Viewer | List/filter employees (`?search=&designation=&department=&skip=&limit=`) |
| `POST` | `/api/employees` | Admin | Create a new employee |
| `GET` | `/api/employees/{id}` | Admin, Viewer | Get employee details |
| `PUT` | `/api/employees/{id}` | Admin | Update an employee |
| `DELETE` | `/api/employees/{id}` | Admin | Soft-delete an employee |
| `POST` | `/api/employees/onboard` | Admin | Create employee + assign assets (one-shot) |
| `POST` | `/api/employees/offboard` | Admin | Offboard employee, return all assets |
| `GET` | `/api/employees/export` | Admin, Viewer | Export employees as CSV or XLSX |

### Assignments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/assignments` | Admin, Viewer | List/filter assignments (`?status=&asset_id=&employee_id=&skip=&limit=`) |
| `POST` | `/api/assignments` | Admin | Assign an asset to an employee |
| `PUT` | `/api/assignments/{id}/return` | Admin | Mark an asset as returned |

### Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/reports` | Admin, Viewer | Generate reports (`?name=recent-assignments\|assets-by-employee\|unassigned-assets\|under-repair\|warranty-expiring&limit=&format=csv\|xlsx`) |
| `GET` | `/api/reports/dashboard` | Admin, Viewer | Dashboard statistics (totals and counts) |
| `POST` | `/api/reports/import/employees` | Admin | Bulk import employees from XLSX |
| `POST` | `/api/reports/import/assets` | Admin | Bulk import assets from XLSX |

### Backups

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/backups` | Admin | Get table row counts |
| `GET` | `/api/backups/export` | Admin | Export full database as JSON |
| `POST` | `/api/backups/restore?mode=replace\|merge` | Admin | Restore database from JSON |

### System

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/init` | — | Initialize database schema and seed default users |

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
| **Session Tokens** | JWT stored in httpOnly, same-site cookies — inaccessible to JavaScript, immune to XSS token theft |
| **Role Enforcement** | Server-side `requireRole()` on every API handler — not client-side gates |
| **SQL Injection** | All queries use parameterized statements via `@libsql/client` — no string interpolation |
| **Soft Delete** | `is_deleted` flag preserves referential integrity; no cascading foreign key issues |
| **Input Size Limits** | API pagination capped at 200 rows; file upload limited to 20 MB via Next.js config |
| **CORS** | Not applicable — API and client are served from the same Next.js origin |

---

## Project Structure

```
asset-nexus/
├── src/
│   ├── app/
│   │   ├── api/                  # REST API routes (19 endpoints)
│   │   │   ├── auth/
│   │   │   ├── assets/
│   │   │   ├── employees/
│   │   │   ├── assignments/
│   │   │   ├── reports/
│   │   │   ├── backups/
│   │   │   └── init/
│   │   ├── (app)/                # Authenticated page routes
│   │   │   ├── dashboard/
│   │   │   ├── employees/
│   │   │   ├── assets/
│   │   │   ├── assignments/
│   │   │   └── reports/
│   │   ├── layout.tsx            # Root layout + AuthProvider
│   │   ├── page.tsx              # Login page
│   │   └── globals.css           # Tailwind v4 + theme variables
│   ├── components/
│   │   ├── auth-provider.tsx     # Client-side auth context
│   │   ├── nav-sidebar.tsx       # App navigation sidebar
│   │   └── ui/                   # shadcn/ui primitives
│   ├── lib/
│   │   ├── auth.ts               # JWT + bcrypt helpers
│   │   ├── db.ts                 # Database client (Turso/SQLite)
│   │   ├── schema.ts             # Table DDL
│   │   ├── seed.ts               # Default user seeder
│   │   ├── init.ts               # One-shot initialization guard
│   │   ├── row.ts                # SQLite row typing helpers
│   │   └── utils.ts              # cn(), formatDate(), formatCurrency(), statusColor()
│   └── types/
│       └── index.ts              # TypeScript interfaces
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

- [ ] **QR Code Labels** — Print and scan QR codes for rapid asset identification
- [ ] **Email Notifications** — Automated alerts for warranty expiry, assignment confirmations
- [ ] **OAuth/SSO** — Single sign-on with Google Workspace, Microsoft Entra ID
- [ ] **Mobile App** — Native or PWA for scanning and on-the-go operations
- [ ] **Depreciation Schedules** — Automated asset value depreciation calculations
- [ ] **Audit Trail UI** — Searchable, filterable audit log interface
- [ ] **Multi-Tenancy** — Organization-scoped data isolation
- [ ] **GraphQL API** — Alternative to REST for flexible queries

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
