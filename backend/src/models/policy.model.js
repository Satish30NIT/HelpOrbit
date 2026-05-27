const pool = require("../config/db");

const POLICY_SELECT = `
  p.id,
  p.policy_name,
  p.title,
  p.description,
  p.company_id,
  p.is_active,
  p.is_deleted,
  p.created_at,
  p.updated_at
`;

function buildListFilters({ search, companyId, status = "all" }) {
  const params = [];
  const conditions = ["p.is_deleted = false"];

  if (companyId) {
    params.push(companyId);
    conditions.push(`p.company_id = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    const i = params.length;
    conditions.push(
      `(p.policy_name ILIKE $${i} OR p.title ILIKE $${i} OR p.description ILIKE $${i} OR c.title ILIKE $${i})`
    );
  }

  let having = "";
  if (status === "pending") {
    having =
      "HAVING COUNT(pa.id) FILTER (WHERE NOT pa.is_acknowledged) > 0";
  } else if (status === "complete") {
    having =
      "HAVING COUNT(pa.id) > 0 AND COUNT(pa.id) FILTER (WHERE NOT pa.is_acknowledged) = 0";
  } else if (status === "unassigned") {
    having = "HAVING COUNT(pa.id) = 0";
  }

  return { params, where: conditions.join(" AND "), having };
}

const LIST_FROM = `
  FROM policies p
  INNER JOIN companies c ON c.id = p.company_id
  LEFT JOIN policy_acknowledgements pa ON pa.policy_id = p.id
`;

async function list({ search, companyId, status = "all", page = 1, limit = 10 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const offset = (safePage - 1) * safeLimit;
  const { params, where, having } = buildListFilters({ search, companyId, status });

  const countSql = `
    SELECT COUNT(*)::int AS total
      FROM (
        SELECT p.id
          ${LIST_FROM}
         WHERE ${where}
         GROUP BY p.id, c.title
         ${having}
      ) filtered`;
  const { rows: countRows } = await pool.query(countSql, params);
  const total = countRows[0]?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / safeLimit), total > 0 ? 1 : 0);
  const currentPage = totalPages > 0 ? Math.min(safePage, totalPages) : 1;
  const currentOffset = (currentPage - 1) * safeLimit;

  const listParams = [...params, safeLimit, currentOffset];
  const limitIdx = listParams.length - 1;
  const offsetIdx = listParams.length;

  const { rows } = await pool.query(
    `SELECT ${POLICY_SELECT},
            c.title AS company_name,
            COUNT(pa.id)::int AS total_users,
            COUNT(pa.id) FILTER (WHERE pa.is_acknowledged)::int AS acknowledged_users,
            COUNT(pa.id) FILTER (WHERE NOT pa.is_acknowledged)::int AS pending_users
       ${LIST_FROM}
      WHERE ${where}
      GROUP BY p.id, c.title
      ${having}
      ORDER BY p.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    listParams
  );

  return {
    items: rows,
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
}

async function findById(id, { includeDeleted = false } = {}) {
  const deletedClause = includeDeleted ? "" : "AND p.is_deleted = false";
  const { rows } = await pool.query(
    `SELECT ${POLICY_SELECT},
            c.title AS company_name,
            c.email AS company_email,
            c.phone AS company_phone,
            c.description AS company_description
       FROM policies p
       INNER JOIN companies c ON c.id = p.company_id
      WHERE p.id = $1 ${deletedClause}
      LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getStats(policyId) {
  const { rows } = await pool.query(
    `SELECT
        COUNT(*)::int AS total_assigned,
        COUNT(*) FILTER (WHERE is_acknowledged)::int AS acknowledged,
        COUNT(*) FILTER (WHERE NOT is_acknowledged)::int AS pending
       FROM policy_acknowledgements
      WHERE policy_id = $1`,
    [policyId]
  );
  return rows[0] || { total_assigned: 0, acknowledged: 0, pending: 0 };
}

async function listAcknowledgements(policyId) {
  const { rows } = await pool.query(
    `SELECT
        pa.id,
        pa.user_id,
        pa.is_acknowledged,
        pa.acknowledged_at,
        pa.created_at,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.user_name,
        u.email,
        c.title AS company_name
       FROM policy_acknowledgements pa
       INNER JOIN users u ON u.id = pa.user_id
       INNER JOIN companies c ON c.id = pa.company_id
      WHERE pa.policy_id = $1
      ORDER BY pa.is_acknowledged ASC, u.first_name ASC, u.email ASC`,
    [policyId]
  );
  return rows;
}

/** All active company members with optional policy acknowledgement row */
async function listCompanyUsersForPolicy(policyId, companyId) {
  const { rows } = await pool.query(
    `SELECT
        pa.id AS ack_id,
        u.id AS user_id,
        pa.is_acknowledged,
        pa.acknowledged_at,
        pa.created_at,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.user_name,
        u.email,
        c.title AS company_name
       FROM user_companies uc
       INNER JOIN users u ON u.id = uc.user_id
       INNER JOIN companies c ON c.id = uc.company_id
       LEFT JOIN policy_acknowledgements pa
         ON pa.policy_id = $1 AND pa.user_id = u.id
      WHERE uc.company_id = $2
        AND uc.is_active = true
        AND u.is_active = true
        AND u.is_deleted = false
      ORDER BY
        (pa.id IS NULL) DESC,
        pa.is_acknowledged ASC NULLS LAST,
        u.first_name ASC NULLS LAST,
        u.email ASC`,
    [policyId, companyId]
  );
  return rows;
}

async function createWithAssignments(client, { companyId, policyName, title, description }) {
  const { rows: policyRows } = await client.query(
    `INSERT INTO policies (company_id, policy_name, title, description)
     VALUES ($1, $2, $3, $4)
     RETURNING ${POLICY_SELECT.replace(/p\./g, "")}`,
    [companyId, policyName, title, description]
  );
  const policy = policyRows[0];

  const { rows: users } = await client.query(
    `SELECT uc.user_id
       FROM user_companies uc
       INNER JOIN users u ON u.id = uc.user_id
      WHERE uc.company_id = $1
        AND uc.is_active = true
        AND u.is_active = true
        AND u.is_deleted = false`,
    [companyId]
  );

  for (const { user_id } of users) {
    await client.query(
      `INSERT INTO policy_acknowledgements (policy_id, user_id, company_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (policy_id, user_id) DO NOTHING`,
      [policy.id, user_id, companyId]
    );
  }

  return policy;
}

async function updateById(id, { policyName, title, description, isActive }) {
  const { rows } = await pool.query(
    `UPDATE policies
        SET policy_name = COALESCE($2, policy_name),
            title = COALESCE($3, title),
            description = COALESCE($4, description),
            is_active = COALESCE($5, is_active),
            updated_at = NOW()
      WHERE id = $1 AND is_deleted = false
      RETURNING ${POLICY_SELECT.replace(/p\./g, "")}`,
    [id, policyName ?? null, title ?? null, description ?? null, isActive ?? null]
  );
  return rows[0] || null;
}

async function softDelete(id) {
  const { rows } = await pool.query(
    `UPDATE policies
        SET is_deleted = true, is_active = false
      WHERE id = $1 AND is_deleted = false
      RETURNING id`,
    [id]
  );
  return rows[0] || null;
}

async function findAcknowledgement(policyId, userId) {
  const { rows } = await pool.query(
    `SELECT id, policy_id, user_id, company_id, is_acknowledged, acknowledged_at
       FROM policy_acknowledgements
      WHERE policy_id = $1 AND user_id = $2
      LIMIT 1`,
    [policyId, userId]
  );
  return rows[0] || null;
}

async function resetAcknowledgement(policyId, userId) {
  const { rows } = await pool.query(
    `UPDATE policy_acknowledgements
        SET is_acknowledged = false, acknowledged_at = NULL
      WHERE policy_id = $1 AND user_id = $2
      RETURNING id`,
    [policyId, userId]
  );
  return rows[0] || null;
}

async function deleteAcknowledgement(policyId, userId) {
  const { rowCount } = await pool.query(
    `DELETE FROM policy_acknowledgements
      WHERE policy_id = $1 AND user_id = $2`,
    [policyId, userId]
  );
  return rowCount > 0;
}

async function assignUser(client, { policyId, userId, companyId }) {
  const db = client || pool;
  const { rows } = await db.query(
    `INSERT INTO policy_acknowledgements (policy_id, user_id, company_id, is_acknowledged, acknowledged_at)
     VALUES ($1, $2, $3, false, NULL)
     ON CONFLICT (policy_id, user_id)
     DO UPDATE SET
       company_id = EXCLUDED.company_id,
       is_acknowledged = false,
       acknowledged_at = NULL,
       updated_at = NOW()
     RETURNING id, policy_id, user_id, is_acknowledged, acknowledged_at`,
    [policyId, userId, companyId]
  );
  return rows[0] || null;
}

async function userBelongsToCompany(userId, companyId) {
  const { rows } = await pool.query(
    `SELECT 1
       FROM user_companies uc
       INNER JOIN users u ON u.id = uc.user_id
      WHERE uc.user_id = $1
        AND uc.company_id = $2
        AND uc.is_active = true
        AND u.is_active = true
        AND u.is_deleted = false
      LIMIT 1`,
    [userId, companyId]
  );
  return rows.length > 0;
}

module.exports = {
  list,
  findById,
  getStats,
  listAcknowledgements,
  listCompanyUsersForPolicy,
  createWithAssignments,
  updateById,
  softDelete,
  findAcknowledgement,
  resetAcknowledgement,
  deleteAcknowledgement,
  assignUser,
  userBelongsToCompany,
};
