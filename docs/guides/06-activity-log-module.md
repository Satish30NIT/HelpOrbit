# 6. Activity log module (in-depth)

Route: **`/dashboard/activity`** · API: **`/api/activity-logs`**

---

## 6.1 Purpose

Single **audit trail** for admin actions on companies and users:

- Who performed the action (actor)
- What changed (action + message + metadata)
- When (`occurred_at`)
- Optional field-level diffs on updates

Writers live in Company/User services; this module **reads and displays** events.

---

## 6.2 Storage

| Store | When used |
|-------|-----------|
| PostgreSQL `activity_logs` | Always (source of truth) |
| Elasticsearch `ELASTIC_AUDIT_LOGS_INDEX` | When `ELASTIC_ENABLED=true` |

```sql
-- migration 004_activity_logs.sql (simplified)
CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY,
  occurred_at   TIMESTAMPTZ NOT NULL,
  category      VARCHAR(40) NOT NULL,   -- 'company' | 'user'
  action        VARCHAR(60) NOT NULL,   -- e.g. company.updated
  message       TEXT NOT NULL,
  actor_user_id INTEGER,
  actor_email   VARCHAR(150),
  target_type   VARCHAR(50),
  target_id     VARCHAR(64),
  target_label  VARCHAR(200),
  metadata      JSONB DEFAULT '{}',
  es_synced_at  TIMESTAMPTZ
);
```

---

## 6.3 Action types

| Action | Source module |
|--------|----------------|
| `company.created` | Company create |
| `company.updated` | Company update |
| `company.deleted` | Company soft delete |
| `user.created` | User create |
| `user.updated` | User update / company sync |
| `user.deleted` | User soft delete |

---

## 6.4 Unified API

`backend/src/routes/activity.routes.js`:

```javascript
router.use(authenticate, requireAdmin);

router.get("/stats", validate(activityStatsQuerySchema, "query"), activityLogController.stats);
router.get("/actors", activityLogController.actorEmails);
router.get("/:logId", validate(activityLogIdParamSchema, "params"), activityLogController.getDocument);
router.get("/", validate(listActivityQuerySchema, "query"), activityLogController.listAll);
```

**List query parameters:**

| Param | Description |
|-------|-------------|
| `category` | `all`, `company`, `user` |
| `company_id` | UUID filter |
| `user_id` | Integer filter |
| `action` | Exact action string |
| `actor_email` | Actor filter |
| `search` | Full-text (ES) |
| `from`, `to` | ISO date range |
| `page`, `limit` | Pagination |

**Example response item:**

```json
{
  "id": "uuid",
  "category": "company",
  "action": "company.updated",
  "message": "Company \"Acme\" was updated",
  "occurred_at": "2026-05-21T12:00:00.000Z",
  "actor": {
    "user_id": 1,
    "email": "admin@example.com",
    "display_name": "Radhe Yadav",
    "role": "admin"
  },
  "target": { "type": "company", "id": "uuid", "label": "Acme" },
  "metadata": {
    "changes": [{ "field": "title", "from": "Old", "to": "Acme" }]
  },
  "source": "elasticsearch"
}
```

---

## 6.5 Unified service — ES vs Postgres

`backend/src/services/unifiedActivityLog.service.js`:

```javascript
async function listActivity(query) {
  const category = normalizeCategory(query.category);

  // Fast path: category-only → delegate to company or user service
  if (category === "company" && !userId) {
    return companyActivityLogService.listActivity(query);
  }
  if (category === "user" && !companyId) {
    return userActivityLogService.listActivity(query);
  }

  // Mixed filters → try Elasticsearch first
  const fromEs = await elasticActivity.searchAuditActivity({ ... });
  if (fromEs) {
    return { items: fromEs.items.map(mapRow), pagination: fromEs.pagination, source: "elasticsearch" };
  }

  // Fallback
  const pg = await activityLogModel.listUnifiedActivity({ ... });
  return { items: pg.items.map(mapRow), pagination: pg.pagination, source: "postgres" };
}
```

---

## 6.6 Writing events (company example)

`companyActivityLog.service.js` after successful DB write:

```javascript
await activityLogModel.insert({
  category: "company",
  action: "company.created",
  message: `Company "${company.title}" was created`,
  actorUserId: ctx.userId,
  actorEmail: ctx.email,
  targetType: "company",
  targetId: company.id,
  targetLabel: company.title,
  metadata: { company: companySnapshot },
  ipAddress: ctx.ip,
  userAgent: ctx.userAgent,
});

// Async ES index (non-blocking)
elasticActivity.indexAuditDocument(logRow).catch(logger.error);
```

---

## 6.7 Elasticsearch (optional)

**Enable:**

```env
ELASTIC_ENABLED=true
ELASTIC_URL=http://localhost:9200
ELASTIC_AUDIT_LOGS_INDEX=helporbit-audit-logs
```

**Backfill:**

```bash
cd backend
npm run backfill:activity-es
node scripts/backfill-user-activity-es.js
```

`elasticCompanyActivity.service.js` — `searchAuditActivity`, `getStats`, index on write.

---

## 6.8 Frontend

**Page:** `frontend/src/app/dashboard/activity/page.tsx`

```typescript
<ActivityLogList
  userId={userId}
  initialCategory={initialCategory}
  showMetrics={false}  // metrics only in header strip
  onDatePresetChange={setMetricsDatePreset}
/>
```

**Header toolbar** — single metrics row + Export:

```typescript
<ActivityLogMetricsStrip datePreset={metricsDatePreset} category={initialCategory} />
<button onClick={handleExport}>Export Logs</button>
```

**List component:** `ActivityLogList.tsx`

- Category tabs, date presets, filters
- Table with pagination
- Drawers: `ActivityLogJsonDrawer`, `ActivityLogChangesDrawer`

**API client:** `frontend/src/lib/activityLogs.ts`

```typescript
export async function fetchActivityLogs(filters: ActivityLogFilters) {
  const res = await api.get(`/activity-logs?${toQuery(filters)}`);
  return res.data;
}
```

**CSV export:** `lib/exportActivityLogs.ts` — exports current page items.

---

## 6.9 Redirect routes

**Company activity** — `companies/activity/page.tsx`:

```typescript
router.replace(`/dashboard/activity?${q}`); // preserves company_id if any
```

**User activity** — sets `category=user` and `user_id`.

---

## 6.10 Flow diagram

```mermaid
flowchart TB
  subgraph writers [Event writers]
    CC[Company CRUD]
    UC[User CRUD]
  end
  subgraph store [Storage]
    PG[(activity_logs)]
    ES[(Elasticsearch)]
  end
  subgraph readers [Activity UI]
    API[/api/activity-logs]
    UI[ActivityLogList]
  end

  CC --> PG
  UC --> PG
  PG --> ES
  API --> PG
  API --> ES
  UI --> API
```

---

## 6.11 Files checklist

| Layer | Files |
|-------|--------|
| Routes | `routes/activity.routes.js` |
| Unified | `services/unifiedActivityLog.service.js` |
| Writers | `companyActivityLog.service.js`, `userActivityLog.service.js` |
| ES | `elasticCompanyActivity.service.js` |
| Model | `models/activityLog.model.js` |
| Frontend | `activity/page.tsx`, `ActivityLogList.tsx`, `lib/activityLogs.ts` |

---

## 6.12 Next

→ [07-policy-module.md](./07-policy-module.md)
