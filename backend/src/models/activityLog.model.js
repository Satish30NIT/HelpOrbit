const pool = require("../config/db");

async function insert(entry) {
  const { rows } = await pool.query(
    `INSERT INTO activity_logs (
       category, action, severity, message,
       actor_user_id, actor_email, actor_role,
       target_type, target_id, target_label,
       ip_address, user_agent, metadata
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::inet, $12, $13::jsonb)
     RETURNING *`,
    [
      entry.category,
      entry.action,
      entry.severity || "info",
      entry.message,
      entry.actor_user_id ?? null,
      entry.actor_email ?? null,
      entry.actor_role ?? null,
      entry.target_type ?? null,
      entry.target_id ?? null,
      entry.target_label ?? null,
      entry.ip_address ?? null,
      entry.user_agent ?? null,
      JSON.stringify(entry.metadata || {}),
    ]
  );
  return rows[0];
}

async function markEsSynced(id) {
  await pool.query(`UPDATE activity_logs SET es_synced_at = NOW() WHERE id = $1`, [id]);
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT
       al.*,
       al.ip_address::text AS ip_address,
       u.first_name AS actor_first_name,
       u.middle_name AS actor_middle_name,
       u.last_name AS actor_last_name,
       u.user_name AS actor_user_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     WHERE al.id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function listCompanyActivity({
  companyId,
  action,
  actorEmail,
  search,
  from,
  to,
  page = 1,
  limit = 20,
}) {
  const params = ["company"];
  const conditions = ["category = $1", "target_type = 'company'"];

  if (companyId) {
    params.push(companyId);
    conditions.push(`target_id = $${params.length}`);
  }
  if (action) {
    params.push(action);
    conditions.push(`action = $${params.length}`);
  }
  if (actorEmail) {
    params.push(`%${actorEmail}%`);
    conditions.push(`actor_email ILIKE $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const n = params.length;
    conditions.push(
      `(message ILIKE $${n} OR target_label ILIKE $${n} OR actor_email ILIKE $${n})`
    );
  }
  if (from) {
    params.push(from);
    conditions.push(`occurred_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`occurred_at <= $${params.length}`);
  }

  const where = conditions.join(" AND ");
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM activity_logs WHERE ${where}`,
    params
  );
  const total = countRes.rows[0].total;

  params.push(safeLimit, offset);
  const { rows } = await pool.query(
    `SELECT
       al.id,
       al.occurred_at,
       al.category,
       al.action,
       al.severity,
       al.message,
       al.actor_user_id,
       al.actor_email,
       al.actor_role,
       al.target_type,
       al.target_id,
       al.target_label,
       al.ip_address::text AS ip_address,
       al.user_agent,
       al.metadata,
       al.es_synced_at,
       u.first_name AS actor_first_name,
       u.middle_name AS actor_middle_name,
       u.last_name AS actor_last_name,
       u.user_name AS actor_user_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     WHERE ${where}
     ORDER BY al.occurred_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    items: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function getCompanyActivityStats(from, to) {
  const periodEnd = to ? new Date(to) : new Date();
  const periodStart = from
    ? new Date(from)
    : new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const spanMs = periodEnd.getTime() - periodStart.getTime();
  const prevEnd = new Date(periodStart.getTime());
  const prevStart = new Date(periodStart.getTime() - spanMs);

  const countFor = async (start, end, extraAction) => {
    const params = [start.toISOString(), end.toISOString()];
    let actionClause = "";
    if (extraAction) {
      params.push(extraAction);
      actionClause = ` AND action = $${params.length}`;
    }
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM activity_logs
       WHERE category = 'company'
         AND occurred_at >= $1::timestamptz
         AND occurred_at <= $2::timestamptz${actionClause}`,
      params
    );
    return rows[0].count;
  };

  const loginCount = async (start, end) => {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM activity_logs
       WHERE action = 'login_success'
         AND occurred_at >= $1::timestamptz
         AND occurred_at <= $2::timestamptz`,
      [start.toISOString(), end.toISOString()]
    );
    return rows[0].count;
  };

  const [total, created, updated, deleted, logins, prevTotal, prevCreated, prevUpdated, prevDeleted, prevLogins] =
    await Promise.all([
      countFor(periodStart, periodEnd),
      countFor(periodStart, periodEnd, "company.created"),
      countFor(periodStart, periodEnd, "company.updated"),
      countFor(periodStart, periodEnd, "company.deleted"),
      loginCount(periodStart, periodEnd),
      countFor(prevStart, prevEnd),
      countFor(prevStart, prevEnd, "company.created"),
      countFor(prevStart, prevEnd, "company.updated"),
      countFor(prevStart, prevEnd, "company.deleted"),
      loginCount(prevStart, prevEnd),
    ]);

  function trend(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  return {
    period: { from: periodStart.toISOString(), to: periodEnd.toISOString() },
    total: { count: total, trend: trend(total, prevTotal) },
    created: { count: created, trend: trend(created, prevCreated) },
    updated: { count: updated, trend: trend(updated, prevUpdated) },
    deleted: { count: deleted, trend: trend(deleted, prevDeleted) },
    logins: { count: logins, trend: trend(logins, prevLogins) },
  };
}

async function listDistinctActors(limit = 50) {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (LOWER(al.actor_email))
       al.actor_email AS email,
       COALESCE(
         NULLIF(TRIM(al.metadata->'modified_by'->>'display_name'), ''),
         NULLIF(TRIM(al.metadata->'modified_by'->>'username'), ''),
         NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)), ''),
         NULLIF(TRIM(u.user_name), ''),
         al.actor_email
       ) AS display_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     WHERE al.category = 'company' AND al.actor_email IS NOT NULL
     ORDER BY LOWER(al.actor_email), al.occurred_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    email: r.email,
    display_name: r.display_name || r.email,
  }));
}

async function listUserActivity({
  userId,
  action,
  actorEmail,
  search,
  from,
  to,
  page = 1,
  limit = 20,
}) {
  const params = ["user"];
  const conditions = ["category = $1", "target_type = 'user'"];

  if (userId) {
    params.push(String(userId));
    conditions.push(`target_id = $${params.length}`);
  }
  if (action) {
    params.push(action);
    conditions.push(`action = $${params.length}`);
  }
  if (actorEmail) {
    params.push(`%${actorEmail}%`);
    conditions.push(`actor_email ILIKE $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const n = params.length;
    conditions.push(
      `(message ILIKE $${n} OR target_label ILIKE $${n} OR actor_email ILIKE $${n})`
    );
  }
  if (from) {
    params.push(from);
    conditions.push(`occurred_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`occurred_at <= $${params.length}`);
  }

  const where = conditions.join(" AND ");
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM activity_logs WHERE ${where}`,
    params
  );
  const total = countRes.rows[0].total;

  params.push(safeLimit, offset);
  const { rows } = await pool.query(
    `SELECT
       al.id,
       al.occurred_at,
       al.category,
       al.action,
       al.severity,
       al.message,
       al.actor_user_id,
       al.actor_email,
       al.actor_role,
       al.target_type,
       al.target_id,
       al.target_label,
       al.ip_address::text AS ip_address,
       al.user_agent,
       al.metadata,
       al.es_synced_at,
       u.first_name AS actor_first_name,
       u.middle_name AS actor_middle_name,
       u.last_name AS actor_last_name,
       u.user_name AS actor_user_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     WHERE ${where}
     ORDER BY al.occurred_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    items: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function getUserActivityStats(from, to) {
  const periodEnd = to ? new Date(to) : new Date();
  const periodStart = from
    ? new Date(from)
    : new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const spanMs = periodEnd.getTime() - periodStart.getTime();
  const prevEnd = new Date(periodStart.getTime());
  const prevStart = new Date(periodStart.getTime() - spanMs);

  const countFor = async (start, end, extraAction) => {
    const params = [start.toISOString(), end.toISOString()];
    let actionClause = "";
    if (extraAction) {
      params.push(extraAction);
      actionClause = ` AND action = $${params.length}`;
    }
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM activity_logs
       WHERE category = 'user'
         AND occurred_at >= $1::timestamptz
         AND occurred_at <= $2::timestamptz${actionClause}`,
      params
    );
    return rows[0].count;
  };

  const [total, created, updated, deleted, prevTotal, prevCreated, prevUpdated, prevDeleted] =
    await Promise.all([
      countFor(periodStart, periodEnd),
      countFor(periodStart, periodEnd, "user.created"),
      countFor(periodStart, periodEnd, "user.updated"),
      countFor(periodStart, periodEnd, "user.deleted"),
      countFor(prevStart, prevEnd),
      countFor(prevStart, prevEnd, "user.created"),
      countFor(prevStart, prevEnd, "user.updated"),
      countFor(prevStart, prevEnd, "user.deleted"),
    ]);

  function trend(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  return {
    period: { from: periodStart.toISOString(), to: periodEnd.toISOString() },
    total: { count: total, trend: trend(total, prevTotal) },
    created: { count: created, trend: trend(created, prevCreated) },
    updated: { count: updated, trend: trend(updated, prevUpdated) },
    deleted: { count: deleted, trend: trend(deleted, prevDeleted) },
  };
}

async function listUserDistinctActors(limit = 50) {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (LOWER(al.actor_email))
       al.actor_email AS email,
       COALESCE(
         NULLIF(TRIM(al.metadata->'modified_by'->>'display_name'), ''),
         NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)), ''),
         NULLIF(TRIM(u.user_name), ''),
         al.actor_email
       ) AS display_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     WHERE al.category = 'user' AND al.actor_email IS NOT NULL
     ORDER BY LOWER(al.actor_email), al.occurred_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    email: r.email,
    display_name: r.display_name || r.email,
  }));
}

async function listUnifiedActivity({
  category,
  companyId,
  userId,
  action,
  actorEmail,
  search,
  from,
  to,
  page = 1,
  limit = 20,
}) {
  const params = [];
  const conditions = ["1=1"];

  if (category && category !== "all") {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (companyId) {
    params.push(companyId);
    conditions.push(`target_type = 'company' AND target_id = $${params.length}`);
  }
  if (userId) {
    params.push(String(userId));
    conditions.push(`target_type = 'user' AND target_id = $${params.length}`);
  }
  if (action) {
    params.push(action);
    conditions.push(`action = $${params.length}`);
  }
  if (actorEmail) {
    params.push(`%${actorEmail}%`);
    conditions.push(`actor_email ILIKE $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const n = params.length;
    conditions.push(
      `(message ILIKE $${n} OR target_label ILIKE $${n} OR actor_email ILIKE $${n})`
    );
  }
  if (from) {
    params.push(from);
    conditions.push(`occurred_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`occurred_at <= $${params.length}`);
  }

  const where = conditions.join(" AND ");
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safePage = Math.max(1, Number(page) || 1);
  const offset = (safePage - 1) * safeLimit;

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM activity_logs WHERE ${where}`,
    params
  );
  const total = countRes.rows[0].total;

  params.push(safeLimit, offset);
  const { rows } = await pool.query(
    `SELECT
       al.id,
       al.occurred_at,
       al.category,
       al.action,
       al.severity,
       al.message,
       al.actor_user_id,
       al.actor_email,
       al.actor_role,
       al.target_type,
       al.target_id,
       al.target_label,
       al.ip_address::text AS ip_address,
       al.user_agent,
       al.metadata,
       al.es_synced_at,
       u.first_name AS actor_first_name,
       u.middle_name AS actor_middle_name,
       u.last_name AS actor_last_name,
       u.user_name AS actor_user_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     WHERE ${where}
     ORDER BY al.occurred_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    items: rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function getUnifiedActivityStats(from, to) {
  const periodEnd = to ? new Date(to) : new Date();
  const periodStart = from
    ? new Date(from)
    : new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const spanMs = periodEnd.getTime() - periodStart.getTime();
  const prevEnd = new Date(periodStart.getTime());
  const prevStart = new Date(periodStart.getTime() - spanMs);

  const countFor = async (start, end, actions) => {
    const params = [start.toISOString(), end.toISOString()];
    let actionClause = "";
    if (actions?.length) {
      const placeholders = actions.map((a) => {
        params.push(a);
        return `$${params.length}`;
      });
      actionClause = ` AND action IN (${placeholders.join(", ")})`;
    }
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM activity_logs
       WHERE occurred_at >= $1::timestamptz
         AND occurred_at <= $2::timestamptz${actionClause}`,
      params
    );
    return rows[0].count;
  };

  const loginCount = async (start, end) => {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM activity_logs
       WHERE action = 'login_success'
         AND occurred_at >= $1::timestamptz
         AND occurred_at <= $2::timestamptz`,
      [start.toISOString(), end.toISOString()]
    );
    return rows[0].count;
  };

  const createdActions = ["company.created", "user.created"];
  const updatedActions = ["company.updated", "user.updated"];
  const deletedActions = ["company.deleted", "user.deleted"];

  const [total, created, updated, deleted, logins, prevTotal, prevCreated, prevUpdated, prevDeleted, prevLogins] =
    await Promise.all([
      countFor(periodStart, periodEnd),
      countFor(periodStart, periodEnd, createdActions),
      countFor(periodStart, periodEnd, updatedActions),
      countFor(periodStart, periodEnd, deletedActions),
      loginCount(periodStart, periodEnd),
      countFor(prevStart, prevEnd),
      countFor(prevStart, prevEnd, createdActions),
      countFor(prevStart, prevEnd, updatedActions),
      countFor(prevStart, prevEnd, deletedActions),
      loginCount(prevStart, prevEnd),
    ]);

  function trend(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  return {
    period: { from: periodStart.toISOString(), to: periodEnd.toISOString() },
    total: { count: total, trend: trend(total, prevTotal) },
    created: { count: created, trend: trend(created, prevCreated) },
    updated: { count: updated, trend: trend(updated, prevUpdated) },
    deleted: { count: deleted, trend: trend(deleted, prevDeleted) },
    logins: { count: logins, trend: trend(logins, prevLogins) },
  };
}

async function listUnifiedDistinctActors(limit = 50) {
  const { rows } = await pool.query(
    `SELECT DISTINCT ON (LOWER(al.actor_email))
       al.actor_email AS email,
       COALESCE(
         NULLIF(TRIM(al.metadata->'modified_by'->>'display_name'), ''),
         NULLIF(TRIM(al.metadata->'modified_by'->>'username'), ''),
         NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)), ''),
         NULLIF(TRIM(u.user_name), ''),
         al.actor_email
       ) AS display_name
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.actor_user_id
     WHERE al.actor_email IS NOT NULL
     ORDER BY LOWER(al.actor_email), al.occurred_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    email: r.email,
    display_name: r.display_name || r.email,
  }));
}

module.exports = {
  insert,
  markEsSynced,
  findById,
  listCompanyActivity,
  getCompanyActivityStats,
  listDistinctActors,
  listUserActivity,
  getUserActivityStats,
  listUserDistinctActors,
  listUnifiedActivity,
  getUnifiedActivityStats,
  listUnifiedDistinctActors,
};
