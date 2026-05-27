# User Module — JIRA Tickets

---

## Parent Ticket

### Title

User module

### Description

Build the User Management module for HelpOrbit.

This module enables admin users to:

- Create users
- View users
- Update users
- Soft-delete users
- Assign roles (admin, user, etc.)
- Map users to one or more companies
- Track all mutations through audit logs
- Access users from the admin dashboard

**Dashboard route:**

`/dashboard/users`

The module must support:

- User CRUD operations
- Password hashing (bcrypt) on create/update
- Role assignment via `role_id`
- Multi-company mapping via `user_companies`
- Soft-delete / deactivate support
- Paginated user listing
- Filtering and searching (by name, email, company, role, status)
- Audit trail integration

**Audit events required:**

- `user.created`
- `user.updated`
- `user.deleted`

An administrator should be able to manage the complete user lifecycle from the admin panel, and every action must be traceable in the activity log system.

**API base path:** `/api/users` (admin + JWT required)

**Dependencies:** Company module (companies must exist for `company_ids` mapping)

**Reference docs:** `docs/PROJECT_GUIDE.md` §3 · `docs/db-schema.md`

### Task List

- User database & model layer
- User REST API
- User activity logging (backend)
- User frontend — API client & types
- User frontend — list page UI
- User module QA

### Child Tickets (7)

Each child ticket has **Title**, **Description**, and **Tasks**. Full detail in sections below.

---

#### 1. Create User

**Title:** Create User

**Description:** Implement functionality for admins to create a new user from the admin dashboard.

**Tasks:**

- Create user form in a drawer (`UserForm.tsx`)
- Add backend Joi validation (`createUserSchema`)
- Hash password with bcrypt before save
- Implement `POST /api/users` endpoint
- Save user row in `users` table
- Insert `user_companies` rows for selected `company_ids`
- Fetch roles for dropdown (`GET /api/users/roles`)
- Record `user.created` audit event
- Handle API success/error responses and toast messages
- Refresh user list after successful create

---

#### 2. View Users

**Title:** View Users

**Description:** Implement user listing and summary view functionality.

**Tasks:**

- Create paginated users table on `/dashboard/users`
- Add search by name, username, or email
- Add status filters (all / active / inactive)
- Add company filter (users linked to a company)
- Implement `GET /api/users` with query params
- Implement `GET /api/users/:id` for user detail + companies
- Fetch users from API on page load and filter change
- Add loading skeleton and empty state
- Add metric cards (total users, active count)
- Show role and mapped companies in table rows

---

#### 3. Update User

**Title:** Update User

**Description:** Allow admins to edit existing user profiles and company assignments.

**Tasks:**

- Reuse user form for edit mode
- Load existing user data (`userToFormValues`)
- Implement `PUT /api/users/:id` endpoint
- Validate update requests (`updateUserSchema`)
- Optional password change on edit (leave blank to keep current)
- Update `user_companies` when `company_ids` change
- Detect field and mapping changes for audit metadata
- Record `user.updated` audit event
- Handle update success/error states and refresh list

---

#### 4. Soft-delete User

**Title:** Soft-delete User

**Description:** Implement soft-delete / deactivation for users.

**Tasks:**

- Add delete action in users table row menu
- Implement soft-delete in `user.model.js` (`is_deleted` / deactivate per rules)
- Implement `DELETE /api/users/:id` API route
- Exclude deleted users from default listing
- Add delete confirmation modal
- Record `user.deleted` audit event
- Show success/error toast after delete

---

#### 5. Manage User–Company Mapping

**Title:** Manage User–Company Mapping

**Description:** Implement many-to-many links between users and companies using `user_companies`.

**Tasks:**

- Ensure `user_companies` table exists (`user_id`, `company_id`, `is_active`)
- Create `userCompany.model.js` with `syncCompanies(userId, companyIds)`
- Add multi-select company picker in user form (searchable dropdown)
- Load companies from company API (`fetchCompanyDropdown`)
- Replace all mappings on create/update (transaction)
- Return `companies[]` on `GET /api/users/:id`
- Optional: dedicated `PUT /api/users/:id/companies` endpoint
- Log company mapping changes in `user.updated` metadata

---

#### 6. Audit Log Integration

**Title:** Audit Log Integration

**Description:** Track all user mutations through activity logs.

**Tasks:**

- Emit `user.created` after successful create
- Emit `user.updated` after profile or company mapping changes
- Emit `user.deleted` after soft delete
- Store actor id, email, display name, and role
- Store target user id and display name
- Implement `GET /api/users/activity-logs` and `GET /api/users/:id/activity-logs`
- Link row action to `/dashboard/activity?user_id=<id>&category=user`
- Redirect `/dashboard/users/activity` to unified activity page
- Optional: index logs to Elasticsearch (backfill script)

---

#### 7. Admin Dashboard Access

**Title:** Admin Dashboard Access

**Description:** Add user management access inside the admin dashboard.

**Tasks:**

- Add `/dashboard/users` route (`users/page.tsx`)
- Add **Users** item in sidebar navigation (`navigation.ts`, admin only)
- Protect route: redirect non-admin users to `/dashboard`
- Use `MainLayout` + `DataPageLayout` for page structure
- Set page header (title, breadcrumbs, “Add user” action)
- Add loading and error states for list and mutations
- Wire “View activity” link per user row

---

## Child Tickets for User Module (detailed)

---

### 1. Create User

#### Title

Create User

#### Description

Implement functionality for admins to create a new user from the admin dashboard.

Admins provide name, username, email, phone, password, role, active flag, and one or more companies. The backend validates input, hashes the password, saves the user, creates `user_companies` rows, and records `user.created`.

#### Tasks

- Create `UserForm.tsx` with fields: first/middle/last name, `user_name`, `email`, `phone`, `password`, `role_id`, `is_active`, company multi-select
- Add backend Joi validation (`createUserSchema`) — email allows dev TLDs (`tlds: false`)
- Implement `POST /api/users` in `user.controller.js` / `user.service.js`
- Hash password using bcrypt (`BCRYPT_ROUNDS` from env)
- Insert user in `users` table
- Insert mappings in `user_companies` inside a transaction
- Call `GET /api/users/roles` for role dropdown options
- Record `user.created` via `userActivityLog.service.js`
- Show toast on success/error; close drawer and reload list

**Key files:** `user.validator.js`, `user.service.js`, `user.model.js`, `userCompany.model.js`, `UserForm.tsx`, `lib/users.ts`

---

### 2. View Users

#### Title

View Users

#### Description

Implement user listing with filters and readable row data (name, email, role, companies, status).

#### Tasks

- Build `/dashboard/users` page with `DataPageLayout`
- Paginated table with `TablePagination`
- Debounced search input
- Filters: status, company (`company_id` query param)
- `GET /api/users?search=&status=&company_id=&page=&limit=`
- Display `userDisplayName()` and company names in table
- Metric row: total users, active count from list/pagination
- Empty state when no users match filters
- Row actions: Edit, Activity history, Delete

**Key files:** `users/page.tsx`, `user.model.js`, `lib/users.ts`, `types/user.ts`

---

### 3. Update User

#### Title

Update User

#### Description

Allow admins to edit user profiles. Password is optional on edit; company mappings can be changed in the same form.

#### Tasks

- Open edit drawer with `userToFormValues(editUser)`
- Implement `PUT /api/users/:id`
- `updateUserSchema`: at least one field; password optional
- Re-sync `user_companies` when `company_ids` provided
- Compare old vs new values for audit `metadata.changes`
- Record `user.updated` activity log
- Refresh list after save

**Key files:** `user.service.js`, `userActivityLog.service.js`, `UserForm.tsx`

---

### 4. Soft-delete User

#### Title

Soft-delete User

#### Description

Remove users from active management without hard-deleting database rows (soft delete / deactivate).

#### Tasks

- Delete button opens `ConfirmDialog`
- `DELETE /api/users/:id` sets `is_deleted` (and/or `is_active = false` per product rules)
- List query excludes deleted users by default
- `user.deleted` audit event with target user summary
- Prevent login for deleted users (auth layer — document/verify)

**Key files:** `user.model.js`, `user.routes.js`, `users/page.tsx`

---

### 5. Manage User–Company Mapping

#### Title

Manage User–Company Mapping

#### Description

Users can belong to multiple companies. Mappings are stored in `user_companies` and edited from the user form or a dedicated sync endpoint.

#### Tasks

- Model: `syncCompanies(userId, companyIds)` — delete removed, insert new, transaction-safe
- Validate `company_ids` are valid UUIDs and companies exist
- UI: multi-select or searchable company list (`fetchCompanyDropdown`)
- Include `company_ids` on create and update payloads
- `PUT /api/users/:id/companies` with `{ company_ids: [] }` if separate endpoint used
- Return companies array on user detail: `{ id, title }` per company

**Key files:** `userCompany.model.js`, `user.validator.js` (`syncCompaniesSchema`), `lib/companies.ts`

---

### 6. Audit Log Integration

#### Title

Audit Log Integration

#### Description

All user admin actions appear in the unified Activity logs module.

#### Tasks

- `user.created` — after create, include role and company ids in metadata
- `user.updated` — include `changes` array for profile fields and mapping updates
- `user.deleted` — after soft delete
- Actor: admin performing action (from JWT)
- Target: `target_type=user`, `target_id`, `target_label` (display name)
- Endpoints: `/api/users/activity-logs`, `/api/users/:id/activity-logs`, stats, actors, `:logId`
- Frontend: History icon → `/dashboard/activity?user_id={id}&category=user`
- `users/activity/page.tsx` redirect to unified activity

**Key files:** `userActivityLog.service.js`, `userActivity.controller.js`, `activity/page.tsx`, `scripts/backfill-user-activity-es.js`

---

### 7. Admin Dashboard Access

#### Title

Admin Dashboard Access

#### Description

Expose Users module only to authenticated admins in the dashboard shell.

#### Tasks

- Route: `frontend/src/app/dashboard/users/page.tsx`
- Nav: `{ label: "Users", href: "/dashboard/users", adminOnly: true }` in `navigation.ts`
- `useEffect`: non-admin → `router.replace("/dashboard")`
- Page header via `usePageHeader` (title, description, breadcrumbs)
- Toolbar: “Add user” opens create drawer
- Consistent loading (`BrandedLoader`, `LoadingOverlay`) and `ApiError` toasts

**Key files:** `navigation.ts`, `dashboard/layout.tsx`, `users/page.tsx`, `AuthContext.tsx`

---

## Optional follow-up stories (from backlog)

| Story | Summary |
|-------|---------|
| User database & model layer | `user.model.js`, `userCompany.model.js` (HO-3-1) |
| User REST API | Validators + routes (HO-3-2) |
| User frontend — API client & types | `lib/users.ts`, `types/user.ts` (HO-3-4) |
| User module QA | Manual test matrix — create, map 2 companies, edit, delete, activity link (HO-3-6) |

---

## Suggested JIRA structure

| JIRA issue | Maps to section |
|------------|-----------------|
| Epic | **User module** (parent) |
| Story | 1. Create User |
| Story | 2. View Users |
| Story | 3. Update User |
| Story | 4. Soft-delete User |
| Story | 5. Manage User–Company Mapping |
| Story | 6. Audit Log Integration |
| Story | 7. Admin Dashboard Access |

Link all stories to the **User module** epic.

**Blocked by:** Company module (minimum: companies exist for mapping dropdown).
