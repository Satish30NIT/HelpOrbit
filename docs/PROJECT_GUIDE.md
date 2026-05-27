# HelpOrbit — Project Guide

HelpOrbit is a **multi-company customer support management platform**. Admins manage companies, users, policies, and a unified audit trail of changes. This document covers **project setup** and the four main application modules.

---

## Table of contents

1. [Project setup](#1-project-setup)
2. [Company module](#2-company-module)
3. [User module](#3-user-module)
4. [Activity log module](#4-activity-log-module)
5. [Policy module](#5-policy-module)
6. [Related documentation](#6-related-documentation)

**In-depth guides with code:** [guides/README.md](./guides/README.md) — project setup, login, dashboard, and each module explained step-by-step.

---

## 1. Project setup

### 1.1 Architecture

```
Browser
   │
   ▼
Next.js (frontend)  ──HTTP + JWT──▶  Express API (backend)
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    ▼                      ▼                      ▼
              PostgreSQL              Redis (optional)    Elasticsearch (optional)
              (source of truth)       (cache)             (audit log search)
```

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express 5, Joi validation |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Audit search | Elasticsearch 8 (optional) |
| Cache | Redis (optional) |

### 1.2 Prerequisites

| Tool | Version |
|------|---------|
| Node.js | **18+** (LTS recommended) |
| npm | 9+ |
| PostgreSQL | 13+ |
| Redis | 6+ (optional) |
| Elasticsearch | 8+ (optional, for fast activity search) |

### 1.3 Repository layout

```
HelpOrbit/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/          # env, db, elastic, redis
│   │   ├── controllers/
│   │   ├── middleware/      # auth, roles, validation
│   │   ├── models/          # SQL data access
│   │   ├── routes/
│   │   ├── services/        # business logic + activity logging
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── migrations/          # incremental SQL migrations
│   ├── scripts/             # seed + ES backfill
│   └── .env.example
├── frontend/                # Next.js app
│   └── src/
│       ├── app/             # routes (App Router)
│       ├── components/
│       ├── config/
│       ├── contexts/
│       ├── lib/             # API clients
│       └── types/
└── docs/                    # documentation
```

### 1.4 Backend setup

```bash
cd HelpOrbit/backend
npm install
cp .env.example .env
# Edit .env with your Postgres credentials, JWT secret, CORS origin
```

**Environment variables** (see `backend/.env.example`):

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `5000`) |
| `CORS_ORIGIN` | Frontend URL (e.g. `http://localhost:3000`) |
| `DB_*` | PostgreSQL connection |
| `JWT_SECRET` | Signing key for tokens |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `REDIS_ENABLED` | `true` / `false` |
| `ELASTIC_ENABLED` | `true` / `false` |
| `ELASTIC_URL` | Elasticsearch URL |
| `ELASTIC_AUDIT_LOGS_INDEX` | Audit index name (default `helporbit-audit-logs`) |

**Database**

1. Create the database:

   ```bash
   createdb helporbit_db
   ```

2. Ensure base tables exist (`users`, `roles`, `companies`, `policies`, `user_companies`, `policy_acknowledgements`, `schema_migrations`). Table definitions are summarized in [db-schema.md](./db-schema.md).

3. Apply incremental migrations (in order):

   ```bash
   psql -d helporbit_db -f migrations/004_activity_logs.sql
   psql -d helporbit_db -f migrations/005_policy_name.sql
   psql -d helporbit_db -f migrations/006_company_address_fields.sql
   psql -d helporbit_db -f migrations/007_company_addresses_table.sql
   psql -d helporbit_db -f migrations/008_rename_address_line_1.sql
   ```

4. Create at least one **admin** user in PostgreSQL (with a bcrypt-hashed password) and assign the `admin` role so you can sign in.

**Run the API**

```bash
npm run dev    # watch mode
# or
npm start
```

Health check: `GET http://localhost:5000/health`

### 1.5 Frontend setup

```bash
cd HelpOrbit/frontend
npm install
```

Create `frontend/.env.local` (optional):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

If unset, the client defaults to `http://localhost:5000/api`.

**Run the UI**

```bash
npm run dev
```

Open `http://localhost:3000`. Unauthenticated users are redirected to `/login`.

### 1.6 Authentication (all modules)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | Public | Body: `{ "identifier", "password" }` — email or username |
| `/api/auth/me` | GET | Bearer JWT | Current user profile |

All module APIs below require:

```
Authorization: Bearer <token>
```

and an **admin** role (`role_name: admin`), unless noted otherwise.

### 1.7 Optional: Elasticsearch for activity logs

```env
ELASTIC_ENABLED=true
ELASTIC_URL=http://localhost:9200
ELASTIC_AUDIT_LOGS_INDEX=helporbit-audit-logs
```

Backfill existing Postgres logs into Elasticsearch:

```bash
cd backend
npm run backfill:activity-es          # company activity
node scripts/backfill-user-activity-es.js   # user activity
npm run reindex:audit-logs            # force reindex company logs
```

When Elasticsearch is disabled, activity queries fall back to PostgreSQL.

---

## 2. Company module

### 2.1 Purpose

Manage **tenant companies**: contact details, address, active/inactive status, and soft delete. Company changes are written to the **activity log** (create, update, delete with field-level `changes` on update).

### 2.2 Data model

| Table | Purpose |
|-------|---------|
| `companies` | Core company record (`title`, `email`, `phone`, `description`, `is_active`, `is_deleted`) |
| `company_addresses` | One address row per company (`address_line_1`, `city`, `state`, `country`, `pin_code`, `formatted_address`) |

See [db-schema.md](./db-schema.md) for column details.

### 2.3 Backend API

Base path: `/api/companies`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Paginated list |
| GET | `/:id` | Single company with address |
| POST | `/` | Create company |
| PUT | `/:id` | Update company |
| DELETE | `/:id` | Soft delete (`is_deleted`) |
| GET | `/activity-logs` | Company-category activity (all companies) |
| GET | `/:id/activity-logs` | Activity for one company |
| GET | `/activity-logs/stats` | Metrics for company actions |
| GET | `/activity-logs/actors` | Distinct actor emails |
| GET | `/activity-logs/:logId` | Full log document (JSON metadata) |

**List query parameters:** `search`, `email`, `status` (`all` \| `active` \| `inactive`), `page`, `limit`, `dropdown` (lightweight list for selects).

**Create / update body (main fields):**

```json
{
  "title": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1-555-0100",
  "description": "Optional notes",
  "address_line_1": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "country": "US",
  "pin_code": "78701",
  "is_active": true
}
```

### 2.4 Activity actions (company)

| Action | When |
|--------|------|
| `company.created` | After successful create |
| `company.updated` | After successful update (`metadata.changes`) |
| `company.deleted` | After soft delete |

Implementation: `backend/src/services/companyActivityLog.service.js`

### 2.5 Frontend

| Route | Page |
|-------|------|
| `/dashboard/companies` | List, filters, metrics, create/edit drawer, view drawer |
| `/dashboard/companies/activity` | Redirects to unified activity with company filter |

**Key files:**

- `frontend/src/app/dashboard/companies/page.tsx`
- `frontend/src/components/companies/CompanyForm.tsx`
- `frontend/src/components/companies/CompanyViewDrawer.tsx`
- `frontend/src/components/companies/CompanyActivityDrawer.tsx`
- `frontend/src/lib/companies.ts`

**Seed sample data (optional):**

```bash
node backend/scripts/seed-companies.js
```

---

## 3. User module

### 3.1 Purpose

Admin **user lifecycle**: create and update profiles, assign **roles**, map users to **one or more companies**, activate/deactivate accounts, and soft-delete users. User CRUD is audited in the activity log.

### 3.2 Data model

| Table | Purpose |
|-------|---------|
| `users` | `first_name`, `middle_name`, `last_name`, `user_name`, `email`, `phone`, `password_hash`, `role_id`, `is_active` |
| `roles` | e.g. `admin`, `user` |
| `user_companies` | Many-to-many: which companies a user belongs to |

### 3.3 Backend API

Base path: `/api/users`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/roles` | List assignable roles |
| GET | `/` | Paginated user list |
| GET | `/:id` | User detail + company memberships |
| POST | `/` | Create user (hashes password) |
| PUT | `/:id` | Update user (optional password change) |
| PUT | `/:id/companies` | Replace company mappings |
| DELETE | `/:id` | Soft delete / deactivate |
| GET | `/activity-logs` | User-category activity (all users) |
| GET | `/:id/activity-logs` | Activity for one user |
| GET | `/activity-logs/stats` | User action metrics |
| GET | `/activity-logs/actors` | Distinct actor emails |
| GET | `/activity-logs/:logId` | Full log document |

**List query parameters:** `search`, `email`, `company_id`, `status`, `role_id`, `page`, `limit`.

**Create body:**

```json
{
  "first_name": "Jane",
  "middle_name": "",
  "last_name": "Doe",
  "user_name": "jane.doe",
  "email": "jane@example.com",
  "phone": "",
  "password": "secure-password",
  "role_id": 2,
  "is_active": true,
  "company_ids": ["<company-uuid>", "<company-uuid>"]
}
```

**Sync companies** (`PUT /:id/companies`):

```json
{ "company_ids": ["<uuid>"] }
```

### 3.4 Activity actions (user)

| Action | When |
|--------|------|
| `user.created` | After successful create |
| `user.updated` | After profile or company mapping changes |
| `user.deleted` | After soft delete |

Implementation: `backend/src/services/userActivityLog.service.js`

### 3.5 Frontend

| Route | Page |
|-------|------|
| `/dashboard/users` | User table, filters, create/edit drawer |
| `/dashboard/users/activity` | Redirects to `/dashboard/activity?category=user` |

**Key files:**

- `frontend/src/app/dashboard/users/page.tsx`
- `frontend/src/components/users/UserForm.tsx`
- `frontend/src/lib/users.ts`

**Note:** Emails with non-standard TLDs (e.g. `user@helporbit.test`) are allowed for development (`tlds: false` in Joi).

---

## 4. Activity log module

### 4.1 Purpose

Provide a **single audit trail** for company and user administrative actions: who did what, when, on which target, with optional field-level diffs and request context (IP, user agent).

### 4.2 Storage

| Store | Role |
|-------|------|
| PostgreSQL `activity_logs` | Source of truth; used when ES is off |
| Elasticsearch `ELASTIC_AUDIT_LOGS_INDEX` | Fast search, filters, and stats when enabled |

Each row / document includes:

- `category`: `company` or `user`
- `action`: e.g. `company.updated`, `user.created`
- `message`, `severity`, `occurred_at`
- Actor: `user_id`, `email`, display name, `role`
- Target: `type`, `id`, `label`
- `metadata` (JSON), e.g. `changes` array on updates

### 4.3 Unified API

Base path: `/api/activity-logs` (admin only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Unified paginated list |
| GET | `/stats` | Aggregated counts (created / updated / deleted) |
| GET | `/actors` | Actor filter dropdown |
| GET | `/:logId` | Single event (full metadata) |

**Query parameters:**

| Param | Description |
|-------|-------------|
| `category` | `all`, `company`, or `user` |
| `company_id` | Filter by company UUID |
| `user_id` | Filter by user integer id |
| `action` | Exact action string |
| `actor_email` | Filter by actor |
| `search` | Text search (ES) |
| `from`, `to` | ISO date range |
| `page`, `limit` | Pagination (default limit 20) |

**Response shape:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "category": "company",
        "action": "company.updated",
        "message": "Company \"Acme\" was updated",
        "occurred_at": "2026-05-21T12:00:00.000Z",
        "actor": { "user_id": 1, "email": "admin@example.com", "display_name": "Admin User", "role": "admin" },
        "target": { "type": "company", "id": "uuid", "label": "Acme" },
        "metadata": { "changes": [{ "field": "title", "from": "A", "to": "Acme" }] },
        "source": "elasticsearch"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 },
    "source": "elasticsearch"
  }
}
```

`source` is `postgres` when Elasticsearch is disabled.

Legacy per-module endpoints remain for compatibility:

- `GET /api/companies/activity-logs` and `GET /api/companies/:id/activity-logs`
- `GET /api/users/activity-logs` and `GET /api/users/:id/activity-logs`

### 4.4 Backend implementation

| File | Role |
|------|------|
| `services/unifiedActivityLog.service.js` | Routes queries to ES or unified Postgres |
| `services/companyActivityLog.service.js` | Company event writers + company-scoped reads |
| `services/userActivityLog.service.js` | User event writers + user-scoped reads |
| `services/elasticCompanyActivity.service.js` | ES index / search |
| `models/activityLog.model.js` | SQL inserts and unified listing |

Migration: `backend/migrations/004_activity_logs.sql`

More detail: [company-activity-logs.md](./company-activity-logs.md)

### 4.5 Frontend

| Route | Description |
|-------|-------------|
| `/dashboard/activity` | Unified activity UI (filters, metrics, table, export CSV) |
| `/dashboard/companies/activity` | Redirect → activity with company context |
| `/dashboard/users/activity` | Redirect → `?category=user` |

**Query examples:**

- All logs: `/dashboard/activity`
- Company only: `/dashboard/activity?category=company`
- One user: `/dashboard/activity?user_id=12&category=user`

**Key files:**

- `frontend/src/app/dashboard/activity/page.tsx`
- `frontend/src/components/activity/ActivityLogList.tsx`
- `frontend/src/lib/activityLogs.ts`
- `frontend/src/lib/exportActivityLogs.ts`

Drawers for JSON payload and field-level changes reuse company activity components.

---

## 5. Policy module

### 5.1 Purpose

Define **company-scoped policies** (internal name + display title + description), auto-assign them to active company users on create, and track **acknowledgements** per user. Admins can inspect status, reset, restrict, or assign individual users.

### 5.2 Data model

| Table | Purpose |
|-------|---------|
| `policies` | `policy_name`, `title`, `description`, `company_id`, `is_active`, `is_deleted` |
| `policy_acknowledgements` | Per `(policy_id, user_id)`: `is_acknowledged`, `acknowledged_at`, `company_id` |

Unique constraint: `(policy_id, user_id)`.

See [db-schema.md](./db-schema.md) and migration `005_policy_name.sql`.

### 5.3 Backend API

Base path: `/api/policies`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Paginated policy list |
| POST | `/` | Create policy + assign all active company users |
| GET | `/:id` | Policy detail, stats, assigned users |
| PUT | `/:id` | Update policy fields |
| DELETE | `/:id` | Soft delete |
| GET | `/:id/status` | Acknowledgement breakdown |
| POST | `/:id/assign-user` | Assign / upsert user acknowledgement row |
| POST | `/:id/reset-user` | Set `is_acknowledged = false` |
| POST | `/:id/restrict-user` | Remove user from policy |

**List query parameters:** `search`, `company_id`, `status` (`all` \| `pending` \| `complete` \| `unassigned`), `page`, `limit`.

**Create body:**

```json
{
  "company_id": "<company-uuid>",
  "policy_name": "order-return-policy",
  "title": "Order Return Policy",
  "description": "Full policy text…"
}
```

**User actions body:**

```json
{ "user_id": 12 }
```

Creating a policy runs in a **transaction**: insert policy, then create `policy_acknowledgements` rows for each active user linked to that company.

### 5.4 Frontend

| Route | Description |
|-------|-------------|
| `/dashboard/policies` | Policy list, filters, stats cards, create/edit |
| `/dashboard/policies?view=<id>` | Opens view/ack drawer for a policy |
| `/dashboard/policies/[id]` | Redirects to `?view=` query |

**Key files:**

- `frontend/src/app/dashboard/policies/page.tsx`
- `frontend/src/components/policies/PolicyForm.tsx`
- `frontend/src/components/policies/PolicyAckDrawer.tsx`
- `frontend/src/components/policies/PolicyStatusModal.tsx`
- `frontend/src/lib/policies.ts`

Full API examples: [policy-api.md](./policy-api.md)

---

## 6. Related documentation

| Document | Contents |
|----------|----------|
| [JIRA_BACKLOG.md](./JIRA_BACKLOG.md) | Epics, stories, and sub-tasks per module (for juniors) |
| [jira/HO-1-project-setup-tickets.md](./jira/HO-1-project-setup-tickets.md) | Project setup JIRA (parent + 7 children) |
| [jira/HO-login-page-tickets.md](./jira/HO-login-page-tickets.md) | Login page JIRA (parent + 7 children) |
| [jira/HO-dashboard-tickets.md](./jira/HO-dashboard-tickets.md) | Dashboard home JIRA (parent + 7 children) |
| [jira/HO-2-company-module-first-ticket.md](./jira/HO-2-company-module-first-ticket.md) | Company module JIRA (parent + 7 children) |
| [jira/HO-3-user-module-tickets.md](./jira/HO-3-user-module-tickets.md) | User module JIRA (parent + 7 children) |
| [jira/HO-4-activity-log-module-tickets.md](./jira/HO-4-activity-log-module-tickets.md) | Activity log module JIRA (parent + 7 children) |
| [jira/HO-5-policy-module-tickets.md](./jira/HO-5-policy-module-tickets.md) | Policy module JIRA (parent + 7 children) |
| [guides/README.md](./guides/README.md) | Developer guides with code (setup → policy) |
| [db-schema.md](./db-schema.md) | Table definitions |
| [policy-api.md](./policy-api.md) | Policy REST examples (curl) |
| [company-activity-logs.md](./company-activity-logs.md) | Company audit configuration |
| [kibana-dashboard-setup.md](./kibana-dashboard-setup.md) | Kibana / ES dashboards |
| [../README.md](../README.md) | Repo overview |

### Navigation (admin UI)

| Sidebar item | Path |
|--------------|------|
| Dashboard | `/dashboard` |
| Companies | `/dashboard/companies` |
| Activity logs | `/dashboard/activity` |
| Users | `/dashboard/users` |
| Policies | `/dashboard/policies` |

Configured in `frontend/src/config/navigation.ts`.

---

## Quick start checklist

- [ ] PostgreSQL database created and base schema present
- [ ] Migrations `004`–`008` applied
- [ ] `backend/.env` configured; API running on port 5000
- [ ] Admin user exists in database
- [ ] `frontend/.env.local` points to API (if not using default)
- [ ] Frontend running on port 3000; login works
- [ ] (Optional) Elasticsearch enabled and backfill scripts run

For questions or gaps in base schema setup, align with your team’s existing Postgres dump or provisioning process—the incremental migrations in `backend/migrations/` assume core tables already exist.
