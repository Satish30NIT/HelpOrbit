# Company activity logs (audit trail)

Company create, update, and delete events are recorded with **actor user details** in PostgreSQL and indexed to **Elasticsearch** when enabled.

## Storage

| Store | Index / table | Purpose |
|-------|----------------|---------|
| PostgreSQL | `activity_logs` | Source of truth, fallback queries |
| Elasticsearch | `helporbit-audit-logs` (env: `ELASTIC_AUDIT_LOGS_INDEX`) | Search & analytics |

## Logged actions

| Action | When |
|--------|------|
| `company.created` | After successful create |
| `company.updated` | After successful update (includes field `changes` in metadata) |
| `company.deleted` | After successful soft delete |

Each entry includes:

- Actor: `user_id`, `email`, `user_name`, `display_name`, `role`
- Target company: `id`, `title`
- Request: `ip_address`, `user_agent`
- `message`, `metadata`, `occurred_at`

## Configuration

```env
ELASTIC_URL=http://localhost:9200
ELASTIC_ENABLED=true
ELASTIC_AUDIT_LOGS_INDEX=helporbit-audit-logs
```

## API (admin, JWT)

### All company activity

`GET /api/companies/activity-logs`

Query: `company_id`, `action`, `actor_email`, `from`, `to`, `page`, `limit`

### Per company

`GET /api/companies/:id/activity-logs`

Same query params except `company_id` is taken from the URL.

Response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "occurred_at": "2026-05-21T12:00:00.000Z",
        "action": "company.updated",
        "message": "Company \"Acme\" was updated",
        "actor": {
          "user_id": 1,
          "email": "admin@example.com",
          "user_name": "admin",
          "display_name": "Radhe Yadav",
          "role": "admin"
        },
        "target": { "type": "company", "id": "uuid", "label": "Acme" },
        "metadata": { "changes": { "title": { "from": "A", "to": "Acme" } } },
        "source": "elasticsearch"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 },
    "source": "elasticsearch"
  }
}
```

When Elasticsearch is disabled, `source` is `postgres`.

## Frontend UI

- **All logs:** `/dashboard/companies/activity` (nav: Activity logs)
- **Per company:** History icon on the companies table, or **View activity log** in the company detail drawer

## Kibana

See [kibana-dashboard-setup.md](./kibana-dashboard-setup.md) and `docker-compose.elasticsearch.yml` at the repo root.
