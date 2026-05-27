# HelpOrbit — JIRA Backlog (Epics & Child Tickets)

Use this document to create JIRA issues for junior developers. Each **Epic** is a parent ticket; **Stories** and **Sub-tasks** are children. Tickets are ordered by dependency.

**Legend**

| Field | Meaning |
|-------|---------|
| **Type** | Epic → Story → Sub-task |
| **SP** | Story points (1 = few hours, 3 = 1 day, 5 = 2–3 days, 8 = week) |
| **Blocked by** | Must finish parent / other ticket first |
| **Reference** | Existing code in repo (for study or parity testing) |

> **Note:** Most of this functionality already exists in the repo. Juniors can (a) **re-implement** following tickets for learning, or (b) **verify, test, and extend** using tickets as a checklist. Reference paths are included either way.

---

## How to use in JIRA

1. Create Epic `HO-1` … `HO-5` (or your project prefix).
2. Under each Epic, create Stories (`HO-10`, `HO-11`, …).
3. Under each Story, create Sub-tasks (`HO-10-1`, …).
4. Copy **Description**, **Acceptance Criteria**, and **Technical notes** into JIRA fields.
5. Link **Blocked by** as JIRA “blocks / is blocked by”.

---

# EPIC HO-1: Project setup & foundation

> **Ready to paste in JIRA:** [jira/HO-1-project-setup-tickets.md](./jira/HO-1-project-setup-tickets.md) (Epic + 7 child tickets with Title, Description, Tasks)

**Epic summary:** Bootstrap HelpOrbit locally — database, API shell, auth, frontend shell, and shared patterns used by all modules.

**Epic goal:** A developer can run backend + frontend, log in as admin, and call authenticated APIs.

**Total estimate:** ~21 SP

---

## HO-1-1 — Story: Repository & environment setup

**SP:** 3 | **Blocked by:** —

### HO-1-1-1 Sub-task: Clone repo and install dependencies

**Description:** Set up Node 18+, install backend and frontend packages.

**Acceptance criteria**

- [ ] Node.js ≥ 18 verified (`node -v`)
- [ ] `backend/npm install` succeeds
- [ ] `frontend/npm install` succeeds
- [ ] No committed secrets in git (`.env` gitignored)

**Steps**

```bash
git clone <repo-url> && cd HelpOrbit
cd backend && npm install
cd ../frontend && npm install
```

**Reference:** `README.md`, `docs/PROJECT_GUIDE.md` §1

---

### HO-1-1-2 Sub-task: Configure backend environment

**Description:** Copy `.env.example` → `.env` and set Postgres, JWT, CORS.

**Acceptance criteria**

- [ ] `backend/.env` exists with valid `DB_*`, `JWT_SECRET`, `CORS_ORIGIN=http://localhost:3000`
- [ ] `PORT=5000`
- [ ] `ELASTIC_ENABLED=false` and `REDIS_ENABLED=false` for first run

**Reference:** `backend/.env.example`, `backend/src/config/env.js`

---

### HO-1-1-3 Sub-task: Configure frontend environment

**Description:** Point UI at API.

**Acceptance criteria**

- [ ] `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
- [ ] Browser network tab shows API calls to correct host

**Reference:** `frontend/src/lib/api.ts`

---

## HO-1-2 — Story: Database foundation

**SP:** 5 | **Blocked by:** HO-1-1

### HO-1-2-1 Sub-task: Create PostgreSQL database

**Acceptance criteria**

- [ ] Database `helporbit_db` (or name from `.env`) exists
- [ ] Can connect via `psql` with credentials from `.env`

---

### HO-1-2-2 Sub-task: Apply base schema (users, roles, companies)

**Description:** Ensure core tables exist before incremental migrations.

**Acceptance criteria**

- [ ] Tables exist: `users`, `roles`, `companies`, `user_companies`, `policies`, `policy_acknowledgements`, `schema_migrations`
- [ ] At least roles: `admin`, `user` (or equivalent)
- [ ] Document any manual SQL used in ticket comment

**Reference:** `docs/db-schema.md`

---

### HO-1-2-3 Sub-task: Run incremental migrations 004–008

**Acceptance criteria**

- [ ] `activity_logs` table exists (004)
- [ ] `policies.policy_name` exists (005)
- [ ] `company_addresses` table exists (007)
- [ ] All versions recorded in `schema_migrations` without errors

**Commands**

```bash
cd backend
psql -d helporbit_db -f migrations/004_activity_logs.sql
psql -d helporbit_db -f migrations/005_policy_name.sql
psql -d helporbit_db -f migrations/006_company_address_fields.sql
psql -d helporbit_db -f migrations/007_company_addresses_table.sql
psql -d helporbit_db -f migrations/008_rename_address_line_1.sql
```

---

### HO-1-2-4 Sub-task: Seed admin user for login

**Acceptance criteria**

- [ ] One user with `role` = admin can log in
- [ ] Password stored as bcrypt hash (not plain text)

**Reference:** `backend/src/services/auth.service.js`, `user.model.js`

---

## HO-1-3 — Story: Backend application shell

**SP:** 5 | **Blocked by:** HO-1-2

### HO-1-3-1 Sub-task: Express app bootstrap

**Acceptance criteria**

- [ ] `GET /health` returns success JSON
- [ ] CORS allows frontend origin
- [ ] JSON body parser enabled (1mb limit)
- [ ] Central `errorHandler` returns consistent `{ success, message }` shape

**Reference:** `backend/src/app.js`, `backend/src/server.js`, `backend/src/middleware/error.middleware.js`

---

### HO-1-3-2 Sub-task: Request logging & Winston

**Acceptance criteria**

- [ ] HTTP requests logged (morgan or equivalent)
- [ ] Errors logged with stack in dev

**Reference:** `backend/src/utils/logger.js`, `requestLogger` middleware

---

### HO-1-3-3 Sub-task: Joi validation middleware

**Acceptance criteria**

- [ ] `validate(schema, 'body'|'query'|'params')` rejects invalid input with 400
- [ ] Validation errors include field-level detail

**Reference:** `backend/src/middleware/validate.js`

---

## HO-1-4 — Story: Authentication module

**SP:** 5 | **Blocked by:** HO-1-3

### HO-1-4-1 Sub-task: POST /api/auth/login

**Acceptance criteria**

- [ ] Accepts `{ identifier, password }` (email or username)
- [ ] Returns JWT + user summary on success
- [ ] Returns 401 on bad credentials (no user enumeration in message)

**Reference:** `backend/src/routes/auth.routes.js`, `auth.controller.js`, `auth.service.js`

---

### HO-1-4-2 Sub-task: GET /api/auth/me

**Acceptance criteria**

- [ ] Requires `Authorization: Bearer <token>`
- [ ] Returns current user profile
- [ ] Returns 401 if token missing/expired

**Reference:** `backend/src/middleware/auth.middleware.js`

---

### HO-1-4-3 Sub-task: Role middleware (admin)

**Acceptance criteria**

- [ ] `requireAdmin` returns 403 for non-admin JWT
- [ ] All module routes use `authenticate` + `requireAdmin` unless specified

**Reference:** `backend/src/middleware/role.middleware.js`

---

## HO-1-5 — Story: Frontend application shell

**SP:** 5 | **Blocked by:** HO-1-4

### HO-1-5-1 Sub-task: Auth context & token storage

**Acceptance criteria**

- [ ] Login stores JWT (memory/localStorage per project convention)
- [ ] `apiFetch` attaches Bearer token by default
- [ ] 401 clears session and redirects to `/login`

**Reference:** `frontend/src/contexts/AuthContext.tsx`, `frontend/src/lib/api.ts`, `frontend/src/lib/auth.ts`

---

### HO-1-5-2 Sub-task: Login page

**Acceptance criteria**

- [ ] `/login` form: identifier + password
- [ ] Success redirects to `/dashboard`
- [ ] Error toast on failure

**Reference:** `frontend/src/app/login/page.tsx`

---

### HO-1-5-3 Sub-task: Dashboard layout (sidebar + header)

**Acceptance criteria**

- [ ] Authenticated routes use `MainLayout` (sidebar, header, main)
- [ ] Unauthenticated users redirected to login
- [ ] Admin-only nav items hidden for non-admin (if applicable)

**Reference:** `frontend/src/app/dashboard/layout.tsx`, `MainLayout.tsx`, `Sidebar.tsx`, `navigation.ts`

---

### HO-1-5-4 Sub-task: Page header context

**Acceptance criteria**

- [ ] Pages set title, description, breadcrumbs via `usePageHeader`
- [ ] Header renders dynamic title and optional toolbar actions

**Reference:** `frontend/src/contexts/PageHeaderContext.tsx`, `Header.tsx`

---

# EPIC HO-2: Company module

> **Ready to paste in JIRA:** [jira/HO-2-company-module-first-ticket.md](./jira/HO-2-company-module-first-ticket.md) (Epic HO-2 + Story HO-2-1 + 3 sub-tasks)

**Epic summary:** Full company CRUD with address, list/filters, metrics, drawers, and company-scoped activity logging.

**Epic goal:** Admin can manage companies; every create/update/delete appears in audit trail.

**Total estimate:** ~34 SP | **Blocked by:** HO-1 (Epic complete)

---

## HO-2-1 — Story: Company database & model layer

**SP:** 5 | **Blocked by:** HO-1-2

### HO-2-1-1 Sub-task: `companies` model — list with filters

**Acceptance criteria**

- [ ] Paginated list: `search`, `email`, `status` (all/active/inactive), `page`, `limit`
- [ ] Excludes `is_deleted = true` by default
- [ ] `dropdown=true` returns lightweight list for selects

**Reference:** `backend/src/models/company.model.js`

---

### HO-2-1-2 Sub-task: `company_addresses` — upsert on create/update

**Acceptance criteria**

- [ ] One address row per company (`company_id` unique)
- [ ] `formatted_address` built from parts when saving
- [ ] Address returned on `GET /:id`

**Reference:** `backend/src/models/companyAddress.model.js`, `backend/src/utils/companyAddress.js`

---

### HO-2-1-3 Sub-task: Soft delete company

**Acceptance criteria**

- [ ] `DELETE` sets `is_deleted` (and deactivates if required by product rules)
- [ ] Deleted companies do not appear in default list

---

## HO-2-2 — Story: Company API (REST)

**SP:** 5 | **Blocked by:** HO-2-1

### HO-2-2-1 Sub-task: Joi validators

**Acceptance criteria**

- [ ] `createCompanySchema`, `updateCompanySchema`, `listCompaniesQuerySchema`, `companyIdParamSchema`
- [ ] Email required on create; update requires at least one field

**Reference:** `backend/src/validators/company.validator.js`

---

### HO-2-2-2 Sub-task: Company service + controller

**Acceptance criteria**

- [ ] `GET /api/companies` — list
- [ ] `GET /api/companies/:id` — detail + address
- [ ] `POST /api/companies` — create (transaction: company + address)
- [ ] `PUT /api/companies/:id` — update with change detection for audit
- [ ] `DELETE /api/companies/:id` — soft delete
- [ ] All routes: admin + JWT

**Reference:** `company.service.js`, `company.controller.js`, `company.routes.js`

---

### HO-2-2-3 Sub-task: API manual test checklist

**Acceptance criteria**

- [ ] Postman/curl collection or ticket comment with 5 example requests and responses
- [ ] 404 for unknown UUID
- [ ] 400 for invalid email

---

## HO-2-3 — Story: Company activity logging (backend)

**SP:** 5 | **Blocked by:** HO-2-2, HO-4-1 (activity table — can stub if Epic 4 not done)

### HO-2-3-1 Sub-task: Record `company.created`

**Acceptance criteria**

- [ ] After successful create, row in `activity_logs` with `category=company`, `action=company.created`
- [ ] Metadata includes company snapshot
- [ ] Actor from JWT + request IP/UA

**Reference:** `backend/src/services/companyActivityLog.service.js`

---

### HO-2-3-2 Sub-task: Record `company.updated` with field changes

**Acceptance criteria**

- [ ] `metadata.changes` array: `{ field, from, to }` for each changed field
- [ ] No log if update is no-op

---

### HO-2-3-3 Sub-task: Record `company.deleted`

**Acceptance criteria**

- [ ] `company.deleted` logged after soft delete
- [ ] Target company id/title in log row

---

### HO-2-3-4 Sub-task: Company activity read endpoints

**Acceptance criteria**

- [ ] `GET /api/companies/activity-logs` — paginated, filters
- [ ] `GET /api/companies/:id/activity-logs` — scoped to company
- [ ] `GET /api/companies/activity-logs/stats` — metric counts
- [ ] `GET /api/companies/activity-logs/:logId` — full document

---

## HO-2-4 — Story: Company frontend — API client & types

**SP:** 3 | **Blocked by:** HO-2-2

### HO-2-4-1 Sub-task: TypeScript types

**Acceptance criteria**

- [ ] `Company`, `CompanyListItem`, create/update payloads typed

**Reference:** `frontend/src/types/company.ts`

---

### HO-2-4-2 Sub-task: `lib/companies.ts` API functions

**Acceptance criteria**

- [ ] `fetchCompanies`, `fetchCompany`, `createCompany`, `updateCompany`, `deleteCompany`
- [ ] Errors throw `ApiError` with message from API

---

## HO-2-5 — Story: Company frontend — list page UI

**SP:** 8 | **Blocked by:** HO-2-4, HO-1-5

### HO-2-5-1 Sub-task: Companies page layout

**Acceptance criteria**

- [ ] Route `/dashboard/companies` (admin only)
- [ ] Uses `DataPageLayout`: metrics row, toolbar, filters, table
- [ ] Page header: title, breadcrumbs, “Add company” action

**Reference:** `frontend/src/app/dashboard/companies/page.tsx`

---

### HO-2-5-2 Sub-task: Metric cards (total / active / inactive)

**Acceptance criteria**

- [ ] Stats load from API (or derived from list endpoint)
- [ ] Loading skeleton while fetching

**Reference:** `CompanyMetricCard.tsx`

---

### HO-2-5-3 Sub-task: Filters & search

**Acceptance criteria**

- [ ] Search by title/email; status filter; pagination
- [ ] Apply resets page to 1

---

### HO-2-5-4 Sub-task: Companies table

**Acceptance criteria**

- [ ] Columns: name, email, phone, status, actions
- [ ] Row actions: View, Edit, Activity, Delete
- [ ] Empty state when no results

---

### HO-2-5-5 Sub-task: Create / edit drawer (`CompanyForm`)

**Acceptance criteria**

- [ ] All address fields + contact fields
- [ ] Client validation matches backend rules
- [ ] Success closes drawer and refreshes list + toast

**Reference:** `CompanyForm.tsx`

---

### HO-2-5-6 Sub-task: View drawer

**Acceptance criteria**

- [ ] Read-only company detail + formatted address

**Reference:** `CompanyViewDrawer.tsx`

---

### HO-2-5-7 Sub-task: Delete confirmation

**Acceptance criteria**

- [ ] `ConfirmDialog` before delete
- [ ] Optimistic UI disabled during request

---

### HO-2-5-8 Sub-task: Company activity drawer (optional scope)

**Acceptance criteria**

- [ ] Opens scoped activity list for one company
- [ ] Or link navigates to `/dashboard/activity?company_id=...`

**Reference:** `CompanyActivityDrawer.tsx`, activity redirect pages

---

## HO-2-6 — Story: Company seed & QA

**SP:** 3 | **Blocked by:** HO-2-5

### HO-2-6-1 Sub-task: Seed script

**Acceptance criteria**

- [ ] `node backend/scripts/seed-companies.js` creates sample companies without duplicates

---

### HO-2-6-2 Sub-task: E2E test script (manual)

**Acceptance criteria**

- [ ] Document: create → edit → view activity → delete
- [ ] Screenshots or screen recording attached to JIRA

---

# EPIC HO-3: User module

> **Ready to paste in JIRA:** [jira/HO-3-user-module-tickets.md](./jira/HO-3-user-module-tickets.md) (Epic + 7 child tickets with Title, Description, Tasks)

**Epic summary:** Admin user CRUD, role assignment, multi-company mapping, and user audit events.

**Epic goal:** Admin can onboard users and assign them to one or more companies.

**Total estimate:** ~34 SP | **Blocked by:** HO-2 (companies must exist for mapping)

---

## HO-3-1 — Story: User database & model layer

**SP:** 5 | **Blocked by:** HO-1-2

### HO-3-1-1 Sub-task: User model — CRUD

**Acceptance criteria**

- [ ] Create hashes password with bcrypt (`BCRYPT_ROUNDS` from env)
- [ ] Update supports optional password change
- [ ] List filters: `search`, `email`, `company_id`, `status`, `role_id`, pagination
- [ ] Soft delete / deactivate per product rules

**Reference:** `backend/src/models/user.model.js`

---

### HO-3-1-2 Sub-task: `user_companies` mapping

**Acceptance criteria**

- [ ] `syncCompanies(userId, companyIds)` replaces mappings in transaction
- [ ] Inactive/deleted companies rejected or skipped (document behavior)

**Reference:** `backend/src/models/userCompany.model.js`

---

### HO-3-1-3 Sub-task: Roles list endpoint data

**Acceptance criteria**

- [ ] `GET /api/users/roles` returns id + name for dropdown

---

## HO-3-2 — Story: User API (REST)

**SP:** 5 | **Blocked by:** HO-3-1

### HO-3-2-1 Sub-task: Joi validators

**Acceptance criteria**

- [ ] `createUserSchema`, `updateUserSchema`, `listUsersQuerySchema`, `syncCompaniesSchema`
- [ ] Email validation allows dev TLDs (`tlds: false`)

**Reference:** `backend/src/validators/user.validator.js`

---

### HO-3-2-2 Sub-task: User service + controller + routes

**Acceptance criteria**

- [ ] Full CRUD + `PUT /:id/companies`
- [ ] `GET /:id` includes `companies[]` with id + title
- [ ] Duplicate email/username returns 409 or 400 with clear message

**Reference:** `user.service.js`, `user.controller.js`, `user.routes.js`

---

## HO-3-3 — Story: User activity logging (backend)

**SP:** 5 | **Blocked by:** HO-3-2, HO-4-1

### HO-3-3-1 Sub-task: `user.created` / `user.updated` / `user.deleted`

**Acceptance criteria**

- [ ] Same pattern as company logs (`category=user`)
- [ ] Update logs company mapping changes in metadata

**Reference:** `backend/src/services/userActivityLog.service.js`

---

### HO-3-3-2 Sub-task: User activity read endpoints

**Acceptance criteria**

- [ ] `GET /api/users/activity-logs`, `/:id/activity-logs`, stats, actors, `:logId`

**Reference:** `userActivity.controller.js`

---

## HO-3-4 — Story: User frontend — API & types

**SP:** 3 | **Blocked by:** HO-3-2

### HO-3-4-1 Sub-task: Types + `lib/users.ts`

**Acceptance criteria**

- [ ] `fetchUsers`, `fetchUser`, `createUser`, `updateUser`, `deleteUser`, `fetchRoles`, `syncUserCompanies`

**Reference:** `frontend/src/types/user.ts`, `frontend/src/lib/users.ts`

---

## HO-3-5 — Story: User frontend — list & form UI

**SP:** 8 | **Blocked by:** HO-3-4, HO-2-5 (company dropdown)

### HO-3-5-1 Sub-task: Users page (`/dashboard/users`)

**Acceptance criteria**

- [ ] Admin-only route
- [ ] Metrics: total users, active count (if applicable)
- [ ] Table with name, email, role, companies, status, actions

**Reference:** `frontend/src/app/dashboard/users/page.tsx`

---

### HO-3-5-2 Sub-task: `UserForm` — create & edit

**Acceptance criteria**

- [ ] Fields: names, username, email, phone, password (required on create), role, active toggle
- [ ] Multi-select companies (searchable)
- [ ] Edit: password optional

**Reference:** `frontend/src/components/users/UserForm.tsx`

---

### HO-3-5-3 Sub-task: Link to user activity

**Acceptance criteria**

- [ ] Row action opens `/dashboard/activity?user_id=<id>&category=user`
- [ ] Redirect page `/dashboard/users/activity` works

**Reference:** `frontend/src/app/dashboard/users/activity/page.tsx`

---

### HO-3-5-4 Sub-task: Filters

**Acceptance criteria**

- [ ] Filter by company, role, status, search
- [ ] Pagination consistent with companies page

---

## HO-3-6 — Story: User module QA

**SP:** 3 | **Blocked by:** HO-3-5

### HO-3-6-1 Sub-task: Manual test matrix

| Case | Expected |
|------|----------|
| Create user with 2 companies | Both links in `user_companies` |
| Update email | `user.updated` in activity log |
| Deactivate user | Hidden from active filter |
| Non-admin JWT | 403 on all `/api/users` |

---

# EPIC HO-4: Activity log module

> **Ready to paste in JIRA:** [jira/HO-4-activity-log-module-tickets.md](./jira/HO-4-activity-log-module-tickets.md) (Epic + 7 child tickets)

**Epic summary:** Unified audit trail for company + user events, Postgres source of truth, optional Elasticsearch search, metrics, export.

**Epic goal:** Single Activity logs page; filterable history with stats and CSV export.

**Total estimate:** ~39 SP | **Blocked by:** HO-2-3, HO-3-3 (writers); can parallelize ES

---

## HO-4-1 — Story: Activity log database

**SP:** 3 | **Blocked by:** HO-1-2

### HO-4-1-1 Sub-task: `activity_logs` table & indexes

**Acceptance criteria**

- [ ] Migration 004 applied
- [ ] Indexes on `occurred_at`, `category`, `action`, `target`, `actor_email`

**Reference:** `backend/migrations/004_activity_logs.sql`

---

### HO-4-1-2 Sub-task: `activityLog.model` — insert & unified list

**Acceptance criteria**

- [ ] `insertLog(...)` used by all writers
- [ ] `listUnifiedActivity` supports category, company_id, user_id, date range, pagination
- [ ] `getUnifiedActivityStats` returns total/created/updated/deleted (+ logins if applicable)

**Reference:** `backend/src/models/activityLog.model.js`

---

## HO-4-2 — Story: Elasticsearch integration (optional)

**SP:** 8 | **Blocked by:** HO-4-1

### HO-4-2-1 Sub-task: Elastic client config

**Acceptance criteria**

- [ ] `ELASTIC_ENABLED=false` → no ES calls, no crash
- [ ] `true` → connects to `ELASTIC_URL`, uses `ELASTIC_AUDIT_LOGS_INDEX`

**Reference:** `backend/src/config/elastic.js`, `elasticCompanyActivity.service.js`

---

### HO-4-2-2 Sub-task: Index document on write

**Acceptance criteria**

- [ ] Each new log indexed async (failure logged, does not fail main transaction)
- [ ] `es_synced_at` updated in Postgres when synced

---

### HO-4-2-3 Sub-task: Search & stats from ES

**Acceptance criteria**

- [ ] `searchAuditActivity` returns paginated hits with same shape as PG mapper
- [ ] Falls back to Postgres when ES disabled or query fails

---

### HO-4-2-4 Sub-task: Backfill scripts

**Acceptance criteria**

- [ ] `npm run backfill:activity-es` indexes historical company logs
- [ ] `node scripts/backfill-user-activity-es.js` indexes user logs
- [ ] Idempotent or documented safe re-run

---

## HO-4-3 — Story: Unified activity API

**SP:** 5 | **Blocked by:** HO-4-1, HO-4-2 (optional)

### HO-4-3-1 Sub-task: `unifiedActivityLog.service`

**Acceptance criteria**

- [ ] Routes category-specific queries to company/user services when unambiguous
- [ ] Otherwise uses ES or unified PG list

**Reference:** `backend/src/services/unifiedActivityLog.service.js`

---

### HO-4-3-2 Sub-task: `/api/activity-logs` routes

**Acceptance criteria**

- [ ] `GET /` — list (query: category, company_id, user_id, action, actor_email, search, from, to, page, limit)
- [ ] `GET /stats`
- [ ] `GET /actors`
- [ ] `GET /:logId`

**Reference:** `backend/src/routes/activity.routes.js`, `activityLog.controller.js`

---

## HO-4-4 — Story: Activity log frontend

**SP:** 8 | **Blocked by:** HO-4-3, HO-1-5

### HO-4-4-1 Sub-task: `lib/activityLogs.ts` + types

**Acceptance criteria**

- [ ] `fetchActivityLogs`, `fetchActivityLogStats`, `fetchActivityLogActors`, `fetchActivityLogDocument`

**Reference:** `frontend/src/lib/activityLogs.ts`, `types/activityLog.ts`

---

### HO-4-4-2 Sub-task: Activity page layout

**Acceptance criteria**

- [ ] Route `/dashboard/activity` (admin)
- [ ] **Single** metrics row in header toolbar (no duplicate in list)
- [ ] Export CSV button in header

**Reference:** `frontend/src/app/dashboard/activity/page.tsx`

---

### HO-4-4-3 Sub-task: `ActivityLogList` — filters & table

**Acceptance criteria**

- [ ] Category tabs: All / Company / User
- [ ] Date preset (7d, 30d, etc.)
- [ ] Filters: action, actor, company, user, search
- [ ] Table: time, actor, action, target, message, view details
- [ ] Pagination

**Reference:** `frontend/src/components/activity/ActivityLogList.tsx`

---

### HO-4-4-4 Sub-task: Metrics strip (`ActivityLogMetricsStrip`)

**Acceptance criteria**

- [ ] Cards: Total, Created, Updated, Deleted, User Logins (when category=all)
- [ ] Trends vs previous period
- [ ] Syncs date preset with list filters via `onDatePresetChange`

**Reference:** `ActivityLogMetricsStrip.tsx`, `ActivityMetricCard.tsx`

---

### HO-4-4-5 Sub-task: Detail drawers

**Acceptance criteria**

- [ ] JSON drawer for raw metadata
- [ ] Changes drawer shows field diff table for updates

**Reference:** `ActivityLogJsonDrawer.tsx`, `ActivityLogChangesDrawer.tsx`

---

### HO-4-4-6 Sub-task: CSV export

**Acceptance criteria**

- [ ] Exports current page items to CSV
- [ ] Toast when empty

**Reference:** `frontend/src/lib/exportActivityLogs.ts`

---

### HO-4-4-7 Sub-task: Legacy redirects

**Acceptance criteria**

- [ ] `/dashboard/companies/activity` → activity with company filter
- [ ] `/dashboard/users/activity` → `?category=user`

---

## HO-4-5 — Story: Activity module QA & docs

**SP:** 3 | **Blocked by:** HO-4-4

### HO-4-5-1 Sub-task: Verify dual storage

- [ ] With ES off: `source: postgres` in API
- [ ] With ES on: `source: elasticsearch` after backfill

### HO-4-5-2 Sub-task: Update `docs/company-activity-logs.md` if API changed

---

# EPIC HO-5: Policy module

> **Ready to paste in JIRA:** [jira/HO-5-policy-module-tickets.md](./jira/HO-5-policy-module-tickets.md) (Epic + 7 child tickets)

**Epic summary:** Company-scoped policies, auto-assign to users, acknowledgement tracking, per-user assign/reset/restrict.

**Epic goal:** Admin can publish policies and see who acknowledged them.

**Total estimate:** ~34 SP | **Blocked by:** HO-2, HO-3

---

## HO-5-1 — Story: Policy database & model

**SP:** 5 | **Blocked by:** HO-1-2

### HO-5-1-1 Sub-task: Policies table + `policy_name`

**Acceptance criteria**

- [ ] Migration 005 applied
- [ ] `policy_name` (slug/internal) separate from `title` (display)

---

### HO-5-1-2 Sub-task: Policy model — CRUD + list filters

**Acceptance criteria**

- [ ] List: `search`, `company_id`, `status` (all/pending/complete/unassigned), pagination
- [ ] Soft delete sets `is_deleted`

**Reference:** `backend/src/models/policy.model.js`

---

### HO-5-1-3 Sub-task: `policy_acknowledgements` model

**Acceptance criteria**

- [ ] Unique `(policy_id, user_id)`
- [ ] `is_acknowledged`, `acknowledged_at` consistency check

---

## HO-5-2 — Story: Policy API (REST)

**SP:** 8 | **Blocked by:** HO-5-1

### HO-5-2-1 Sub-task: Create policy (transaction)

**Acceptance criteria**

- [ ] `POST /api/policies` creates policy
- [ ] Auto-creates acknowledgement rows for all **active** users linked to `company_id`
- [ ] Rolls back on failure

**Reference:** `backend/src/services/policy.service.js`

---

### HO-5-2-2 Sub-task: Read & update & delete

**Acceptance criteria**

- [ ] `GET /:id` — detail + stats + assigned users
- [ ] `PUT /:id` — update fields
- [ ] `DELETE /:id` — soft delete

---

### HO-5-2-3 Sub-task: Policy status endpoint

**Acceptance criteria**

- [ ] `GET /:id/status` — counts + per-user acknowledgement state

---

### HO-5-2-4 Sub-task: Per-user actions

**Acceptance criteria**

- [ ] `POST /:id/assign-user` — body `{ user_id }`
- [ ] `POST /:id/reset-user` — clears acknowledgement
- [ ] `POST /:id/restrict-user` — removes assignment row

**Reference:** `docs/policy-api.md`

---

## HO-5-3 — Story: Policy frontend — API & types

**SP:** 3 | **Blocked by:** HO-5-2

### HO-5-3-1 Sub-task: `lib/policies.ts` + types

**Acceptance criteria**

- [ ] All policy endpoints wrapped; types for list item, detail, status

---

## HO-5-4 — Story: Policy frontend — UI

**SP:** 8 | **Blocked by:** HO-5-3, HO-2-5

### HO-5-4-1 Sub-task: Policies list page

**Acceptance criteria**

- [ ] Route `/dashboard/policies`
- [ ] Stats cards: total, acknowledged (page), pending (page)
- [ ] Table: title, company, status, actions
- [ ] Filters: search, company, status

**Reference:** `frontend/src/app/dashboard/policies/page.tsx`

---

### HO-5-4-2 Sub-task: `PolicyForm` — create/edit

**Acceptance criteria**

- [ ] Company select (required on create)
- [ ] `policy_name`, `title`, `description`
- [ ] Validation matches backend

**Reference:** `PolicyForm.tsx`

---

### HO-5-4-3 Sub-task: Policy view / ack drawer

**Acceptance criteria**

- [ ] Deep link `?view=<policyId>`
- [ ] Shows policy body + acknowledgement list
- [ ] Admin actions: reset / restrict / assign user (if in scope)

**Reference:** `PolicyAckDrawer.tsx`, `PolicyViewDrawer.tsx`

---

### HO-5-4-4 Sub-task: Policy status modal

**Acceptance criteria**

- [ ] Breakdown UI for acknowledged vs pending users

**Reference:** `PolicyStatusModal.tsx`

---

### HO-5-4-5 Sub-task: Redirect route `[id]`

**Acceptance criteria**

- [ ] `/dashboard/policies/[id]` redirects to `?view=`

**Reference:** `frontend/src/app/dashboard/policies/[id]/page.tsx`

---

## HO-5-5 — Story: Policy module QA

**SP:** 3 | **Blocked by:** HO-5-4

### HO-5-5-1 Sub-task: Manual test matrix

| Case | Expected |
|------|----------|
| Create policy for company with 3 users | 3 acknowledgement rows |
| reset-user | User shows pending again |
| restrict-user | User removed from policy list |
| assign-user | User re-added with pending ack |

---

# Cross-epic: Definition of Done (all modules)

Apply to every Story before marking **Done**:

- [ ] Code reviewed by senior
- [ ] No secrets in git
- [ ] Joi validation on all inputs
- [ ] Admin-only routes enforced
- [ ] Error responses use `ApiError` / consistent JSON
- [ ] Frontend: loading, empty, and error states
- [ ] Toast on success/failure for mutations
- [ ] `npm run lint` passes in `frontend`
- [ ] Manual test steps documented in JIRA comment
- [ ] Update `docs/PROJECT_GUIDE.md` if API or routes changed

---

# Suggested sprint plan (junior roadmap)

| Sprint | Epics | Goal |
|--------|-------|------|
| 1 | HO-1 | Run app + login |
| 2 | HO-2 | Companies end-to-end |
| 3 | HO-3 | Users end-to-end |
| 4 | HO-4 | Activity logs + optional ES |
| 5 | HO-5 | Policies + polish |

---

# JIRA import cheat sheet

| Epic | JIRA Epic title | # Stories | # Sub-tasks (approx) |
|------|-----------------|-----------|----------------------|
| HO-1 | Project setup & foundation | 5 | 18 |
| HO-2 | Company module | 6 | 22 |
| HO-3 | User module | 6 | 18 |
| HO-4 | Activity log module | 5 | 20 |
| HO-5 | Policy module | 5 | 17 |

**Labels:** `backend`, `frontend`, `postgres`, `elasticsearch`, `admin-only`, `helporbit`

**Components:** `api`, `web`, `database`, `audit`

---

# Related docs

- [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) — functional reference
- [db-schema.md](./db-schema.md) — tables
- [policy-api.md](./policy-api.md) — policy curl examples
- [company-activity-logs.md](./company-activity-logs.md) — audit configuration
