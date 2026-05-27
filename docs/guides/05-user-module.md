# 5. User module (in-depth)

Route: **`/dashboard/users`** · API: **`/api/users`**

---

## 5.1 Data model

**`users`**

| Column | Notes |
|--------|--------|
| `id` | Integer PK |
| `first_name`, `middle_name`, `last_name` | Display name |
| `user_name`, `email`, `phone` | Login + contact |
| `password` | bcrypt hash |
| `role_id` | FK → `roles` |
| `is_active`, `is_deleted` | Status |

**`user_companies`** — many-to-many

| Column | Notes |
|--------|--------|
| `user_id`, `company_id` | Composite uniqueness |
| `is_active` | Mapping active flag |

**`roles`** — e.g. `admin`, `user`

---

## 5.2 API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/roles` | Role dropdown |
| GET | `/api/users` | Paginated list |
| GET | `/api/users/:id` | Detail + companies[] |
| POST | `/api/users` | Create (hash password) |
| PUT | `/api/users/:id` | Update |
| PUT | `/api/users/:id/companies` | Replace company mappings |
| DELETE | `/api/users/:id` | Soft delete |
| GET | `/api/users/activity-logs` | User audit events |

**List query:** `search`, `email`, `company_id`, `status`, `role_id`, `page`, `limit`

**Create body:**

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "user_name": "jane.doe",
  "email": "jane@example.com",
  "password": "secure-password",
  "role_id": 2,
  "is_active": true,
  "company_ids": ["uuid-company-1", "uuid-company-2"]
}
```

---

## 5.3 Backend: routes

`backend/src/routes/user.routes.js`:

```javascript
router.use(authenticate, requireAdmin);

router.get("/roles", userController.listRoles);
router.get("/", validate(listUsersQuerySchema, "query"), userController.list);
router.post("/", validate(createUserSchema), userController.create);
router.put("/:id", validate(userIdParamSchema, "params"), validate(updateUserSchema), userController.update);
router.put("/:id/companies", validate(syncCompaniesSchema), userController.syncCompanies);
router.delete("/:id", validate(userIdParamSchema, "params"), userController.remove);
```

---

## 5.4 Validation

`backend/src/validators/user.validator.js` — dev-friendly email:

```javascript
const emailSchema = Joi.string().trim().email({ tlds: false }).max(255);

const createUserSchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  user_name: Joi.string().trim().min(2).max(80).required(),
  email: emailSchema.required(),
  password: Joi.string().min(6).max(128).required(),
  role_id: Joi.number().integer().min(1).default(1),
  company_ids: Joi.array().items(uuid).default([]),
});
```

Allows emails like `user@helporbit.test` for E2E.

---

## 5.5 Company mapping sync

`backend/src/models/userCompany.model.js`:

```javascript
async function syncCompanies(userId, companyIds, client) {
  // DELETE mappings not in list
  // INSERT new mappings ON CONFLICT update
}
```

Called from `user.service` on create/update when `company_ids` is provided.

---

## 5.6 Activity logging

`backend/src/services/userActivityLog.service.js`

| Action | When |
|--------|------|
| `user.created` | After create |
| `user.updated` | Profile or company mapping changes |
| `user.deleted` | After soft delete |

Same `activity_logs` table as company events; `category = 'user'`.

---

## 5.7 Frontend API client

`frontend/src/lib/users.ts`:

```typescript
export async function fetchUsers(params: {
  search?: string;
  company_id?: string;
  status?: UserStatusFilter;
  page?: number;
  limit?: number;
}) { /* GET /users */ }

export async function createUser(body: UserFormValues) {
  return api.post("/users", body);
}

export function userDisplayName(u: UserListItem): string {
  const parts = [u.first_name, u.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : u.user_name || u.email;
}
```

---

## 5.8 Frontend UI

**Page:** `frontend/src/app/dashboard/users/page.tsx`

- Metrics: total users, active count
- Filters: search, company, status
- Table: name, email, role, companies, actions
- `UserForm` drawer — create/edit
- Link to activity: `/dashboard/activity?user_id={id}&category=user`

**Form:** `components/users/UserForm.tsx`

- Password required on create, optional on edit
- Role `<select>` from `fetchRoles()`
- Company multi-select from `fetchCompanyDropdown()`

---

## 5.9 Activity redirect

`frontend/src/app/dashboard/users/activity/page.tsx`:

```typescript
const q = new URLSearchParams(searchParams.toString());
q.set("category", "user");
router.replace(`/dashboard/activity?${q.toString()}`);
```

---

## 5.10 Dependency

User module requires **companies** to exist for mapping dropdown. Policies module requires **users** mapped to companies for auto-assign.

---

## 5.11 Files checklist

| Layer | Files |
|-------|--------|
| Routes | `routes/user.routes.js` |
| Service | `services/user.service.js`, `userActivityLog.service.js` |
| Model | `models/user.model.js`, `userCompany.model.js` |
| Frontend | `users/page.tsx`, `UserForm.tsx`, `lib/users.ts` |

---

## 5.12 Next

→ [06-activity-log-module.md](./06-activity-log-module.md)
