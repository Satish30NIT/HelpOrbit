# Policy Management API (Admin)

Base URL: `http://localhost:5000/api`

All endpoints require:

```
Authorization: Bearer <JWT>
```

Admin role only (`role_name: admin`).

---

## Companies

### `GET /companies`

Query: `search`, `limit` (default 50)

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/companies?search=radha"
```

---

## Policies

### `GET /policies`

List with search, company filter, pagination.

Query: `search`, `company_id`, `page` (default 1), `limit` (default 10)

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/policies?page=1&limit=10&company_id=<uuid>"
```

### `POST /policies`

Creates policy and auto-assigns all active company users (transaction).

```json
{
  "company_id": "uuid",
  "policy_name": "order-return-policy",
  "title": "Order Return Policy",
  "description": "Full policy text…"
}
```

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company_id":"...","policy_name":"...","title":"...","description":"..."}' \
  http://localhost:5000/api/policies
```

### `GET /policies/:id`

Policy details, company, statistics, assigned users.

### `PUT /policies/:id`

```json
{
  "policy_name": "updated-name",
  "title": "Updated Title",
  "description": "Updated body"
}
```

### `DELETE /policies/:id`

Soft delete (`is_deleted = true`).

### `GET /policies/:id/status`

Acknowledgement breakdown and user-wise status.

### `POST /policies/:id/reset-user`

```json
{ "user_id": 12 }
```

Sets `is_acknowledged = false`, `acknowledged_at = null`.

### `POST /policies/:id/restrict-user`

```json
{ "user_id": 12 }
```

Removes user from policy (deletes acknowledgement row).

### `POST /policies/:id/assign-user`

```json
{ "user_id": 12 }
```

Re-assigns user (upsert, prevents duplicates).

---

## Database

Migration `005_policy_name.sql` adds `policies.policy_name`.

Tables: `companies`, `users`, `user_companies`, `policies`, `policy_acknowledgements`.
