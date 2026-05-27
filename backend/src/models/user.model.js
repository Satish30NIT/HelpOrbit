const pool = require("../config/db");

const USER_SELECT = `
  u.id,
  u.first_name,
  u.middle_name,
  u.last_name,
  u.user_name,
  u.email,
  u.phone,
  u.role_id,
  r.role_name,
  u.is_active,
  u.is_deleted,
  u.created_at,
  u.updated_at
`;

function mapUserRow(row) {
  if (!row) return null;
  let companies = row.companies;
  if (typeof companies === "string") {
    try {
      companies = JSON.parse(companies);
    } catch {
      companies = [];
    }
  }
  if (!Array.isArray(companies)) companies = [];
  const { password, ...rest } = row;
  return { ...rest, companies };
}

function buildListFilters({ search, email, companyId, status = "all", roleId }) {
  const params = [];
  const conditions = ["u.is_deleted = false"];

  if (status === "active") conditions.push("u.is_active = true");
  else if (status === "inactive") conditions.push("u.is_active = false");

  if (roleId) {
    params.push(roleId);
    conditions.push(`u.role_id = $${params.length}`);
  }

  if (email) {
    params.push(`%${email}%`);
    conditions.push(`u.email ILIKE $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    const n = params.length;
    conditions.push(
      `(u.user_name ILIKE $${n} OR u.email ILIKE $${n} OR u.first_name ILIKE $${n} OR u.last_name ILIKE $${n})`
    );
  }

  if (companyId) {
    params.push(companyId);
    conditions.push(`EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = u.id AND uc.company_id = $${params.length} AND uc.is_active = true
    )`);
  }

  return { params, where: conditions.join(" AND ") };
}

const COMPANY_AGG = `
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'email', c.email
      )
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::json
  ) AS companies
`;

async function list({ search, email, companyId, status = "all", roleId, page = 1, limit = 10 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 100));
  const { params, where } = buildListFilters({ search, email, companyId, status, roleId });

  const countSql = `
    SELECT COUNT(DISTINCT u.id)::int AS total
      FROM users u
      LEFT JOIN roles r ON r.id = u.role_id
      LEFT JOIN user_companies uc ON uc.user_id = u.id AND uc.is_active = true
      LEFT JOIN companies c ON c.id = uc.company_id AND c.is_deleted = false
     WHERE ${where}`;
  const { rows: countRows } = await pool.query(countSql, params);
  const total = countRows[0]?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / safeLimit), total > 0 ? 1 : 0);
  const currentPage = totalPages > 0 ? Math.min(safePage, totalPages) : 1;
  const offset = (currentPage - 1) * safeLimit;

  const listParams = [...params, safeLimit, offset];
  const limitIdx = listParams.length - 1;
  const offsetIdx = listParams.length;

  const { rows } = await pool.query(
    `SELECT ${USER_SELECT},
            ${COMPANY_AGG}
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_companies uc ON uc.user_id = u.id AND uc.is_active = true
       LEFT JOIN companies c ON c.id = uc.company_id AND c.is_deleted = false
      WHERE ${where}
      GROUP BY u.id, r.role_name
      ORDER BY u.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    listParams
  );

  return {
    items: rows.map(mapUserRow),
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT ${USER_SELECT}, u.password
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findByUsername(userName) {
  const { rows } = await pool.query(
    `SELECT ${USER_SELECT}, u.password
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
      WHERE LOWER(u.user_name) = LOWER($1)
      LIMIT 1`,
    [userName]
  );
  return rows[0] || null;
}

async function findByEmailOrUsername(identifier) {
  const { rows } = await pool.query(
    `SELECT ${USER_SELECT}, u.password
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
      WHERE LOWER(u.email) = LOWER($1)
         OR LOWER(u.user_name) = LOWER($1)
      LIMIT 1`,
    [identifier]
  );
  return rows[0] || null;
}

async function findById(id, { includeDeleted = false } = {}) {
  const deletedClause = includeDeleted ? "" : " AND u.is_deleted = false";
  const { rows } = await pool.query(
    `SELECT ${USER_SELECT},
            ${COMPANY_AGG}
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_companies uc ON uc.user_id = u.id AND uc.is_active = true
       LEFT JOIN companies c ON c.id = uc.company_id AND c.is_deleted = false
      WHERE u.id = $1${deletedClause}
      GROUP BY u.id, r.role_name
      LIMIT 1`,
    [id]
  );
  return mapUserRow(rows[0] || null);
}

async function emailExists(email, excludeId = null) {
  const params = [email];
  let sql = `SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) AND is_deleted = false`;
  if (excludeId) {
    params.push(excludeId);
    sql += ` AND id <> $${params.length}`;
  }
  const { rows } = await pool.query(sql, params);
  return rows.length > 0;
}

async function usernameExists(userName, excludeId = null) {
  const params = [userName];
  let sql = `SELECT 1 FROM users WHERE LOWER(user_name) = LOWER($1) AND is_deleted = false`;
  if (excludeId) {
    params.push(excludeId);
    sql += ` AND id <> $${params.length}`;
  }
  const { rows } = await pool.query(sql, params);
  return rows.length > 0;
}

async function create(
  {
    firstName,
    middleName,
    lastName,
    userName,
    email,
    phone,
    passwordHash,
    roleId,
    isActive,
  },
  client
) {
  const db = client || pool;
  const { rows } = await db.query(
    `INSERT INTO users (
       first_name, middle_name, last_name, user_name, email, phone, password, role_id, is_active
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      firstName,
      middleName || null,
      lastName,
      userName,
      email,
      phone || null,
      passwordHash,
      roleId,
      isActive !== false,
    ]
  );
  return rows[0].id;
}

async function updateById(
  id,
  { firstName, middleName, lastName, userName, email, phone, passwordHash, roleId, isActive }
) {
  const { rows } = await pool.query(
    `UPDATE users SET
       first_name = COALESCE($2, first_name),
       middle_name = COALESCE($3, middle_name),
       last_name = COALESCE($4, last_name),
       user_name = COALESCE($5, user_name),
       email = COALESCE($6, email),
       phone = COALESCE($7, phone),
       password = COALESCE($8, password),
       role_id = COALESCE($9, role_id),
       is_active = COALESCE($10, is_active),
       updated_at = NOW()
     WHERE id = $1 AND is_deleted = false
     RETURNING id`,
    [
      id,
      firstName ?? null,
      middleName ?? null,
      lastName ?? null,
      userName ?? null,
      email ?? null,
      phone ?? null,
      passwordHash ?? null,
      roleId ?? null,
      isActive ?? null,
    ]
  );
  if (!rows[0]) return null;
  return findById(id);
}

async function softDelete(id) {
  const { rows } = await pool.query(
    `UPDATE users SET is_deleted = true, is_active = false, updated_at = NOW()
      WHERE id = $1 AND is_deleted = false
      RETURNING id`,
    [id]
  );
  return rows[0] || null;
}

async function updatePassword(id, hashedPassword) {
  await pool.query(`UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`, [
    hashedPassword,
    id,
  ]);
}

async function listRoles() {
  const { rows } = await pool.query(`SELECT id, role_name FROM roles ORDER BY id`);
  return rows;
}

function sanitize(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

module.exports = {
  list,
  findByEmail,
  findByUsername,
  findByEmailOrUsername,
  findById,
  emailExists,
  usernameExists,
  create,
  updateById,
  softDelete,
  updatePassword,
  listRoles,
  sanitize,
};
