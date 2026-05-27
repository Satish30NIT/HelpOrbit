# Kibana dashboard setup (company activity)

Use this guide after Elasticsearch is running and the HelpOrbit backend has indexed at least one company activity event.

## 1. Start Elasticsearch & Kibana

From the project root:

```bash
docker compose -f docker-compose.elasticsearch.yml up -d
```

Verify:

```bash
curl http://localhost:9200
curl http://localhost:9200/helporbit-audit-logs/_count
```

Backend `.env`:

```env
ELASTIC_URL=http://localhost:9200
ELASTIC_ENABLED=true
ELASTIC_AUDIT_LOGS_INDEX=helporbit-audit-logs
```

Restart the API, then create or update a company in the admin UI to produce sample documents.

Open Kibana: **http://localhost:5601**

## 2. Create a data view

1. **Stack Management** → **Data views** → **Create data view**
2. Name: `HelpOrbit Company Activity`
3. Index pattern: `helporbit-audit-logs` (must match `ELASTIC_AUDIT_LOGS_INDEX`)
4. Timestamp field: `occurred_at`
5. Save

### Field reference (from index mapping)

| Field | ES type | Use in dashboards |
|-------|---------|-------------------|
| `occurred_at` | date | Time axis, date histograms |
| `action` | keyword | Pie, filters (`company.created`, `company.updated`, `company.deleted`) |
| `severity` | keyword | Filters |
| `message` | text | Discover table |
| `actor_email` | keyword | Terms, filters |
| `actor_display_name` | text | Table column |
| `actor_role` | keyword | Breakdown by role |
| `actor_user_id` | integer | — |
| `target_id` | keyword | Filter by company |
| `target_label` | keyword | Company name in charts |
| `ip_address` | ip | Security views |
| `metadata` | object | Nested `metadata.changes` on updates |

## 3. Discover (explore raw events)

1. **Analytics** → **Discover**
2. Select data view **HelpOrbit Company Activity**
3. Recommended columns: `occurred_at`, `action`, `message`, `actor_display_name`, `actor_email`, `target_label`, `ip_address`
4. Save a search named `Company activity — all events` if you want to reuse it in dashboards

**Useful KQL filters:**

```
action: "company.deleted"
actor_email: "admin@example.com"
target_label: "Acme Corp"
```

## 4. Sample visualizations

Create these under **Analytics** → **Visualize Library** (Lens recommended).

### A. Activity over time

- Type: **Area** or **Line**
- Vertical axis: Count
- Horizontal axis: `occurred_at` (Date histogram, auto interval)
- Optional split: `action` (Terms, top 5)

### B. Actions breakdown

- Type: **Donut** or **Pie**
- Slice by: `action` (Terms)
- Metric: Count

### C. Top actors

- Type: **Bar horizontal**
- Y-axis: `actor_email.keyword` or `actor_email` (Terms, size 10)
- X-axis: Count

### D. Events by company

- Type: **Data table**
- Rows: `target_label` (Terms, size 15)
- Metric: Count
- Sort: Count descending

### E. Updates with field changes (optional)

In **Discover**, expand a `company.updated` document and inspect `metadata.changes`. For dashboards, use a **Data table** with runtime field or JSON in Discover only unless you add an ingest pipeline to flatten changes.

## 5. Dashboard

1. **Analytics** → **Dashboard** → **Create dashboard**
2. Add saved visualizations: **Activity over time**, **Actions breakdown**, **Top actors**, **Events by company**
3. Add a **Controls** panel (optional):
   - Options list on `action`
   - Options list on `actor_email`
   - Date range control on `occurred_at`
4. Title: `HelpOrbit — Company activity`
5. Save

## 6. Export / import saved objects (optional)

To share dashboards across environments:

1. **Stack Management** → **Saved Objects**
2. Export objects (data views, visualizations, dashboard)
3. Import on another Kibana instance connected to an index with the same pattern

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| Index missing | Set `ELASTIC_ENABLED=true`, restart API; perform a company CRUD action |
| UI shows `source: postgres` | ES unreachable or empty; check `curl localhost:9200` and backend logs |
| Kibana “no matching indices” | Pattern must be `helporbit-audit-logs`; confirm `_count` > 0 |
| Timestamp not available | Recreate data view with `occurred_at` as time field |

## Related

- In-app UI: **Dashboard → Activity logs** (`/dashboard/companies/activity`)
- API & logging: [company-activity-logs.md](./company-activity-logs.md)
