# Policy Module — JIRA Tickets

---

## Parent Ticket

### Title

Policy module

### Description

Build the Policy Management module for HelpOrbit.

This module enables admin users to:

- Create policies scoped to a company
- View policies in a paginated list
- Update policy content and metadata
- Soft-delete policies
- Auto-assign policies to active company users on create
- Track per-user acknowledgement status
- Reset, restrict, or assign individual users on a policy
- Access policies from the admin dashboard

**Dashboard route:**

`/dashboard/policies`

The module must support:

- Policy CRUD operations
- `policy_name` (internal/slug) and `title` (display)
- Company-scoped policies (`company_id` FK)
- `policy_acknowledgements` per user
- List filters: search, company, status (all / pending / complete / unassigned)
- Transactional create (policy + bulk acknowledgement rows)
- Soft-delete support

**API base path:** `/api/policies` (admin + JWT required)

**Dependencies:** Company module, User module (users mapped to companies for auto-assign)

**Reference docs:** `docs/PROJECT_GUIDE.md` §5 · `docs/policy-api.md` · `docs/db-schema.md`

### Task List

- Policy database & model layer
- Policy REST API
- Policy acknowledgement logic (assign / reset / restrict)
- Policy frontend — API client & types
- Policy frontend — list page UI
- Policy view & status UI
- Policy module QA

### Child Tickets (7)

Each child ticket has **Title**, **Description**, and **Tasks**. Full detail in sections below.

---

#### 1. Create Policy

**Title:** Create Policy

**Description:** Implement functionality for admins to create a company policy and auto-assign it to users.

**Tasks:**

- Create policy form (`PolicyForm.tsx`)
- Select company (required)
- Fields: `policy_name`, `title`, `description`
- Auto-generate `policy_name` from title (optional helper)
- Backend `POST /api/policies` validation
- Transaction: insert policy + acknowledgement rows for active company users
- Handle success/error toasts
- Refresh policy list after create

---

#### 2. View Policies

**Title:** View Policies

**Description:** Implement policy listing with filters, stats, and detail view.

**Tasks:**

- Paginated policies table on `/dashboard/policies`
- Search by title or policy name
- Filter by company and acknowledgement status
- Stats cards: total, acknowledged (page), pending (page)
- `GET /api/policies` with query params
- `GET /api/policies/:id` for detail
- Open view drawer via `?view=<policyId>`
- Loading and empty states

---

#### 3. Update Policy

**Title:** Update Policy

**Description:** Allow admins to edit policy title, name, description, and active flag.

**Tasks:**

- Edit mode in `PolicyForm` or separate drawer
- Load existing policy data
- `PUT /api/policies/:id`
- `updatePolicySchema` validation
- Handle success/error and refresh list
- Do not duplicate acknowledgement rows on update

---

#### 4. Soft-delete Policy

**Title:** Soft-delete Policy

**Description:** Soft-delete policies so they no longer appear in default lists.

**Tasks:**

- Delete action in table with confirmation
- `DELETE /api/policies/:id` sets `is_deleted = true`
- Exclude deleted from list queries
- Success/error toast

---

#### 5. Policy Acknowledgements

**Title:** Policy Acknowledgements

**Description:** Track which users must acknowledge each policy and their status.

**Tasks:**

- `policy_acknowledgements` table unique on `(policy_id, user_id)`
- On create: insert row per active user on company
- `GET /api/policies/:id/status` — breakdown counts + user list
- `PolicyStatusModal` or section in ack drawer
- Display acknowledged vs pending per user
- Show `acknowledged_at` when complete

---

#### 6. Per-user Policy Actions

**Title:** Per-user Policy Actions

**Description:** Admin actions to manage individual user assignments on a policy.

**Tasks:**

- `POST /api/policies/:id/assign-user` — body `{ user_id }`
- `POST /api/policies/:id/reset-user` — clear acknowledgement
- `POST /api/policies/:id/restrict-user` — remove user from policy
- Wire buttons in `PolicyAckDrawer` / status UI
- Refresh status after each action

---

#### 7. Admin Dashboard Access

**Title:** Admin Dashboard Access

**Description:** Expose Policies in the admin dashboard navigation and routing.

**Tasks:**

- Route `/dashboard/policies` and `/dashboard/policies/[id]` redirect
- Sidebar nav item **Policies** (admin only)
- Protect route for non-admin
- `DataPageLayout` + page header with “Add policy”
- Link from dashboard home module card
- Deep link `?view=` opens acknowledgement drawer

---

## Child Tickets for Policy Module (detailed)

---

### 1. Create Policy

**Key files:** `PolicyForm.tsx`, `policy.validator.js`, `policy.service.js`, `policy.model.js`, `lib/policies.ts`, `lib/slug.ts` (`titleToPolicyName`)

---

### 2. View Policies

**Key files:** `policies/page.tsx`, `PolicyAckDrawer.tsx`, `lib/policies.ts`

---

### 3. Update Policy

**Key files:** `policy.service.js`, `PolicyForm.tsx`

---

### 4. Soft-delete Policy

**Key files:** `policy.model.js`, `policies/page.tsx`, `ConfirmDialog.tsx`

---

### 5. Policy Acknowledgements

**Key files:** `policy.model.js` (ack inserts), `PolicyStatusModal.tsx`, `GET /:id/status`

---

### 6. Per-user Policy Actions

**Key files:** `policy.controller.js`, `policy.routes.js`, `PolicyAckDrawer.tsx`

---

### 7. Admin Dashboard Access

**Key files:** `navigation.ts`, `dashboardContent.ts` (policies module card), `policies/[id]/page.tsx`

---

## Suggested JIRA structure

| JIRA issue | Maps to section |
|------------|-----------------|
| Epic | **Policy module** |
| Story | 1–7 as listed above |

**Blocked by:** Company module, User module
