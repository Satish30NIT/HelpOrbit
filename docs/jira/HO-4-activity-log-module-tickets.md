# Activity Log Module — JIRA Tickets

---

## Parent Ticket

### Title

Activity log module

### Description

Build the unified **Activity Log** module for HelpOrbit — a single audit trail for all company and user administrative changes.

This module enables admin users to:

- View all audit events in one place
- Filter by category (company / user), company, user, action, actor, date range
- See metrics (total, created, updated, deleted, user logins)
- Open event details (JSON metadata, field-level changes)
- Export current page to CSV
- Access activity from sidebar and deep links from Company/User modules

**Dashboard route:**

`/dashboard/activity`

**Legacy redirects:**

- `/dashboard/companies/activity` → activity with company context
- `/dashboard/users/activity` → `/dashboard/activity?category=user`

The module must support:

- PostgreSQL `activity_logs` as source of truth
- Optional Elasticsearch for search and stats when enabled
- Unified API `/api/activity-logs`
- Categories: `company`, `user`
- Actions: `company.created|updated|deleted`, `user.created|updated|deleted`
- Actor and target metadata on every event
- Paginated list with filters

**Audit events consumed (written by other modules):**

- `company.created`, `company.updated`, `company.deleted`
- `user.created`, `user.updated`, `user.deleted`

An administrator should be able to investigate who changed what and when, with export for compliance review.

**API base path:** `/api/activity-logs` (admin + JWT)

**Dependencies:** Company module and User module (event writers), Project setup (optional Elasticsearch)

**Reference docs:** `docs/PROJECT_GUIDE.md` §4 · `docs/company-activity-logs.md`

### Task List

- Activity log database & model layer
- Elasticsearch integration (optional)
- Unified activity REST API
- Activity log writers (company + user) — coordination with other epics
- Activity frontend — API client & types
- Activity log list page UI
- Activity log module QA

### Child Tickets (7)

Each child ticket has **Title**, **Description**, and **Tasks**. Full detail in sections below.

---

#### 1. Activity Log Database

**Title:** Activity Log Database

**Description:** Create and query the `activity_logs` table in PostgreSQL.

**Tasks:**

- Apply migration `004_activity_logs.sql`
- Columns: category, action, message, actor fields, target fields, metadata JSONB, `occurred_at`
- Indexes on occurred_at, category, action, target, actor_email
- `activityLog.model.js` — `insertLog`, `listUnifiedActivity`, stats helpers
- Paginated list with filters

---

#### 2. Unified Activity REST API

**Title:** Unified Activity REST API

**Description:** Expose admin endpoints for listing, stats, actors, and single document fetch.

**Tasks:**

- `GET /api/activity-logs` — unified list
- `GET /api/activity-logs/stats` — metric counts + trends
- `GET /api/activity-logs/actors` — distinct actor emails
- `GET /api/activity-logs/:logId` — full document
- Joi `listActivityQuerySchema` (category, company_id, user_id, action, dates, page, limit)
- `unifiedActivityLog.service.js` — route to ES or Postgres
- Admin + JWT on all routes

---

#### 3. Elasticsearch Integration (Optional)

**Title:** Elasticsearch Integration (Optional)

**Description:** Index and search audit logs in Elasticsearch when enabled.

**Tasks:**

- Configure `ELASTIC_ENABLED`, `ELASTIC_URL`, `ELASTIC_AUDIT_LOGS_INDEX`
- `elasticCompanyActivity.service.js` — index on write, search, stats
- Fallback to Postgres when ES disabled or query fails
- Backfill scripts: `backfill-company-activity-es.js`, `backfill-user-activity-es.js`
- Set `es_synced_at` on Postgres rows when indexed
- Response includes `source: elasticsearch` or `postgres`

---

#### 4. Activity Event Writers

**Title:** Activity Event Writers

**Description:** Ensure company and user modules emit audit events (coordination ticket).

**Tasks:**

- `companyActivityLog.service.js` — created / updated / deleted
- `userActivityLog.service.js` — created / updated / deleted
- Include actor from JWT + IP + user agent
- Update events include `metadata.changes` array
- Non-blocking ES index (log errors, don’t fail CRUD)
- Legacy routes: `/api/companies/activity-logs`, `/api/users/activity-logs`

---

#### 5. Activity Log List UI

**Title:** Activity Log List UI

**Description:** Main table with filters, category tabs, and pagination.

**Tasks:**

- Page `/dashboard/activity` with `ActivityLogList`
- Category filter: All / Company / User
- Date presets (7d, 30d, custom range)
- Filters: action, actor email, company, user, search
- Table columns: time, actor, category, action, target, message
- Row actions: view JSON, view changes (if update)
- `showMetrics={false}` on list (metrics in header only)
- Query params: `?user_id=`, `?category=company`

---

#### 6. Metrics, Export & Detail Drawers

**Title:** Metrics, Export & Detail Drawers

**Description:** Header metrics strip, CSV export, and detail drawers.

**Tasks:**

- `ActivityLogMetricsStrip` in page header toolbar
- Cards: Total, Created, Updated, Deleted, User Logins
- Single metrics row (no duplicate in list)
- Export CSV button — current page items
- `ActivityLogJsonDrawer` — raw metadata
- `ActivityLogChangesDrawer` — field diff table
- `exportActivityLogs.ts` helper

---

#### 7. Admin Dashboard Access & Redirects

**Title:** Admin Dashboard Access & Redirects

**Description:** Navigation, redirects, and links from other modules.

**Tasks:**

- Sidebar **Activity logs** → `/dashboard/activity`
- Admin-only route guard
- Redirect `companies/activity/page.tsx` to unified activity
- Redirect `users/activity/page.tsx` with `category=user`
- Company row / user row “History” links with query params
- `CompanyActivityDrawer` for per-company scoped view (optional)
- Page header: title, description, Export toolbar

---

## Child Tickets for Activity Log Module (detailed)

---

### 1. Activity Log Database

**Key files:** `migrations/004_activity_logs.sql`, `models/activityLog.model.js`

---

### 2. Unified Activity REST API

**Key files:** `routes/activity.routes.js`, `controllers/activityLog.controller.js`, `validators/activityLog.validator.js`, `unifiedActivityLog.service.js`

---

### 3. Elasticsearch Integration (Optional)

**Key files:** `config/elastic.js`, `elasticCompanyActivity.service.js`, `scripts/backfill-*.js`

---

### 4. Activity Event Writers

**Key files:** `companyActivityLog.service.js`, `userActivityLog.service.js`

---

### 5. Activity Log List UI

**Key files:** `activity/page.tsx`, `ActivityLogList.tsx`, `lib/activityLogs.ts`, `lib/activityDateRange.ts`

---

### 6. Metrics, Export & Detail Drawers

**Key files:** `ActivityLogMetricsStrip.tsx`, `ActivityMetricCard.tsx`, `ActivityLogJsonDrawer.tsx`, `exportActivityLogs.ts`

---

### 7. Admin Dashboard Access & Redirects

**Key files:** `navigation.ts`, `companies/activity/page.tsx`, `users/activity/page.tsx`, `activity/page.tsx`

---

## Suggested JIRA structure

| JIRA issue | Maps to section |
|------------|-----------------|
| Epic | **Activity log module** |
| Story | 1–7 as listed above |

**Blocked by:** Project setup (DB), Company module + User module (writers)

**Can parallelize:** ES integration (ticket 3) with UI (tickets 5–7) after API exists
