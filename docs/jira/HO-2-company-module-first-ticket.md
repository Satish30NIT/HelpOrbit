# Company Module — JIRA Tickets

---

## Parent Ticket

### Title

Company module

### Description

Build the Company Management module for HelpOrbit.

This module enables admin users to:

- Create companies
- View companies
- Update companies
- Soft-delete companies
- Manage normalized company addresses
- Track all mutations through audit logs
- Access companies from the admin dashboard

**Dashboard route:**

`/dashboard/companies`

The module must support:

- Company CRUD operations
- Soft-delete support
- Address normalization using `company_addresses`
- Paginated company listing
- Filtering and searching
- Audit trail integration

**Audit events required:**

- `company.created`
- `company.updated`
- `company.deleted`

An administrator should be able to manage the complete company lifecycle from the admin panel, and every action must be traceable in the activity log system.

**API base path:** `/api/companies` (admin + JWT required)

**Reference docs:** `docs/PROJECT_GUIDE.md` §2 · `docs/db-schema.md`

### Task List

- Company database & model layer
- Company REST API
- Company activity logging (backend)
- Company frontend — API client & types
- Company frontend — list page UI
- Company seed & QA

### Child Tickets (7)

Each child ticket has **Title**, **Description**, and **Tasks**. Full detail in sections below.

---

#### 1. Create Company

**Title:** Create Company

**Description:** Implement functionality for admins to create a new company from the admin dashboard.

**Tasks:**

- Create company form in a drawer
- Add backend validation (Joi)
- Save company data in database
- Upsert address in `company_addresses`
- Build `formatted_address` from address parts
- Record `company.created` audit event
- Handle API success/error responses
- Refresh company list after create

---

#### 2. View Companies

**Title:** View Companies

**Description:** Implement company listing and detail view functionality.

**Tasks:**

- Create paginated companies table
- Add search functionality
- Add status filters (all / active / inactive)
- Create company detail drawer
- Implement `GET /api/companies` and `GET /api/companies/:id`
- Fetch companies from API
- Add loading skeleton and empty state
- Add metric cards on list page

---

#### 3. Update Company

**Title:** Update Company

**Description:** Allow admins to edit existing company information.

**Tasks:**

- Create edit company form (reuse create form)
- Load existing company data
- Implement `PUT /api/companies/:id`
- Validate update requests
- Update company and address in one transaction
- Detect field changes for audit metadata
- Record `company.updated` audit event
- Handle update success/error states

---

#### 4. Soft-delete Company

**Title:** Soft-delete Company

**Description:** Implement soft-delete functionality for companies.

**Tasks:**

- Add delete action in UI
- Implement soft-delete backend logic (`is_deleted = true`)
- Exclude deleted companies from listing
- Add delete confirmation modal
- Implement `DELETE /api/companies/:id`
- Record `company.deleted` audit event
- Show success/error toast after delete

---

#### 5. Manage Company Addresses

**Title:** Manage Company Addresses

**Description:** Implement normalized address management using `company_addresses`.

**Tasks:**

- Create `company_addresses` table (migrations)
- Create address model/entity
- Add address form fields
- Link address with company (`company_id` UNIQUE)
- Upsert address on create and update
- Store `formatted_address` for display
- Return address on company detail API

---

#### 6. Audit Log Integration

**Title:** Audit Log Integration

**Description:** Track all company mutations through activity logs.

**Tasks:**

- Emit `company.created` event
- Emit `company.updated` event
- Emit `company.deleted` event
- Store actor and timestamp metadata
- Store target company id and title
- Add company activity log API endpoints
- Integrate with activity log module (`/dashboard/activity`)
- Optional: sync logs to Elasticsearch

---

#### 7. Admin Dashboard Access

**Title:** Admin Dashboard Access

**Description:** Add company management access inside the admin dashboard.

**Tasks:**

- Add `/dashboard/companies` route
- Add sidebar navigation item (Companies)
- Protect route with admin auth
- Create dashboard page layout (`DataPageLayout`)
- Set page header and breadcrumbs
- Add loading and error states
- Link to company activity from list or drawer

---

## Child Tickets for Company Module (detailed)

---

### 1. Create Company

#### Title

Create Company

#### Description

Implement functionality for admins to create a new company from the admin dashboard.

Admins fill a form with company details and address fields. On submit, the backend validates input, saves the company in PostgreSQL, upserts a row in `company_addresses`, and records a `company.created` audit event.

#### Tasks

- Create company form in a drawer (`CompanyForm.tsx`)
- Add backend Joi validation (`createCompanySchema`)
- Implement `POST /api/companies` endpoint
- Save company row in `companies` table (transaction)
- Upsert address in `company_addresses` table
- Build `formatted_address` from address parts
- Record `company.created` activity log with actor metadata
- Handle API success/error responses and toast messages
- Refresh company list after successful create

**Key files:** `company.validator.js`, `company.service.js`, `company.controller.js`, `CompanyForm.tsx`, `lib/companies.ts`

---

### 2. View Companies

#### Title

View Companies

#### Description

Implement company listing and detail view functionality.

Admins see a paginated table of companies with search and status filters. They can open a read-only detail drawer for a single company including formatted address and related stats where applicable.

#### Tasks

- Create paginated companies table on `/dashboard/companies`
- Add search by company title (and email filter if exposed)
- Add status filters (all / active / inactive)
- Implement `GET /api/companies` with query params (`search`, `email`, `status`, `page`, `limit`)
- Create company detail view drawer (`CompanyViewDrawer.tsx`)
- Implement `GET /api/companies/:id` for single company + address
- Fetch companies from API on page load and when filters change
- Add loading skeleton and empty state when no companies exist
- Add metric cards (total / active / inactive) on list page

**Key files:** `companies/page.tsx`, `company.model.js`, `CompanyViewDrawer.tsx`, `CompanyMetricCard.tsx`

---

### 3. Update Company

#### Title

Update Company

#### Description

Allow admins to edit existing company information.

The edit form loads current company and address data. Updates run in a transaction; changed fields are detected for the audit log `metadata.changes` array.

#### Tasks

- Reuse or extend company form for edit mode
- Load existing company data when opening edit drawer
- Implement `PUT /api/companies/:id` endpoint
- Add `updateCompanySchema` validation (at least one field required)
- Update `companies` and `company_addresses` in one transaction
- Detect field-level changes for audit metadata
- Record `company.updated` activity log event
- Handle update success/error states and refresh list

**Key files:** `company.service.js`, `companyActivityLog.service.js`, `CompanyForm.tsx`

---

### 4. Soft-delete Company

#### Title

Soft-delete Company

#### Description

Implement soft-delete functionality for companies.

Deleting a company does not remove the row from the database. It sets `is_deleted = true` (and deactivates per product rules) so the company no longer appears in default listings.

#### Tasks

- Add delete action in companies table row menu
- Implement soft-delete in `company.model.js` (`is_deleted = true`)
- Implement `DELETE /api/companies/:id` API route
- Exclude deleted companies from `GET /api/companies` list queries
- Add delete confirmation modal (`ConfirmDialog`)
- Record `company.deleted` audit event with company id/title
- Show success/error toast after delete

**Key files:** `company.model.js`, `company.routes.js`, `companies/page.tsx`

---

### 5. Manage Company Addresses

#### Title

Manage Company Addresses

#### Description

Implement normalized address management using `company_addresses`.

Each company has at most one address record. Address fields are edited as part of the company create/update form and stored separately from the core company row.

#### Tasks

- Ensure `company_addresses` table exists (migrations 006, 007, 008)
- Create address model (`companyAddress.model.js`)
- Add address form fields: `address_line_1`, `city`, `state`, `country`, `pin_code`
- Link address to company via `company_id` (UNIQUE FK)
- Implement `upsertByCompanyId` on create and update
- Compute and store `formatted_address` for display and search
- Return address fields on `GET /api/companies/:id`
- Join address data in company list query for table display

**Key files:** `companyAddress.model.js`, `utils/companyAddress.js`, `migrations/007_company_addresses_table.sql`

---

### 6. Audit Log Integration

#### Title

Audit Log Integration

#### Description

Track all company mutations through activity logs.

Every create, update, and delete writes to PostgreSQL `activity_logs` (and Elasticsearch when enabled). Logs include actor user, timestamp, target company, IP, user agent, and change details on update.

#### Tasks

- Emit `company.created` after successful create
- Emit `company.updated` after successful update (include `metadata.changes`)
- Emit `company.deleted` after successful soft delete
- Store actor id, email, display name, and role in log row
- Store target company id and title as `target_type` / `target_id` / `target_label`
- Implement `GET /api/companies/activity-logs` and `GET /api/companies/:id/activity-logs`
- Integrate with unified Activity logs UI (`/dashboard/activity`)
- Optional: index logs to Elasticsearch (`ELASTIC_AUDIT_LOGS_INDEX`)

**Key files:** `companyActivityLog.service.js`, `activityLog.model.js`, `ActivityLogList.tsx`, `CompanyActivityDrawer.tsx`

---

### 7. Admin Dashboard Access

#### Title

Admin Dashboard Access

#### Description

Add company management access inside the admin dashboard.

Only authenticated admin users can open the companies module. Navigation, layout, and page header follow the same patterns as Users and Policies.

#### Tasks

- Add `/dashboard/companies` route (`companies/page.tsx`)
- Add **Companies** item in sidebar navigation (`navigation.ts`)
- Protect route: redirect non-admin users to `/dashboard`
- Use `MainLayout` + `DataPageLayout` for consistent page structure
- Set page header (title, breadcrumbs, “Add company” action) via `usePageHeader`
- Add loading and error states for list and mutations
- Wire company activity shortcut (drawer or link to `/dashboard/activity?category=company`)

**Key files:** `navigation.ts`, `dashboard/layout.tsx`, `DataPageLayout.tsx`, `companies/page.tsx`

---

## Optional follow-up stories (from backlog)

| Story | Summary |
|-------|---------|
| Company database & model layer | Backend models only (HO-2-1) — can be done before UI if building from scratch |
| Company REST API | Validators + routes (HO-2-2) |
| Company frontend — API client & types | `lib/companies.ts`, TypeScript types (HO-2-4) |
| Company seed & QA | `seed-companies.js` + manual test matrix (HO-2-6) |

---

## Suggested JIRA structure

| JIRA issue | Maps to section |
|------------|-----------------|
| Epic | **Company module** (parent) |
| Story | 1. Create Company |
| Story | 2. View Companies |
| Story | 3. Update Company |
| Story | 4. Soft-delete Company |
| Story | 5. Manage Company Addresses |
| Story | 6. Audit Log Integration |
| Story | 7. Admin Dashboard Access |

Link all stories to the **Company module** epic.
