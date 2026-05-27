const pool = require("../config/db");
const companyAddressModel = require("./companyAddress.model");
const { formatFullAddress } = require("../utils/companyAddress");

const COMPANY_CORE = `
  c.id,
  c.title,
  c.description,
  c.email,
  c.phone,
  c.is_active,
  c.is_deleted,
  c.created_at,
  c.updated_at
`;

const ADDRESS_COALESCE = `
  ca.address_line_1,
  ca.city,
  ca.state,
  ca.country,
  ca.pin_code,
  ca.formatted_address AS address
`;

const ADDRESS_JOIN = `LEFT JOIN company_addresses ca ON ca.company_id = c.id`;

const STATS_JOINS = `
  LEFT JOIN user_companies uc
    ON uc.company_id = c.id AND uc.is_active = true
  LEFT JOIN users u
    ON u.id = uc.user_id AND u.is_active = true AND u.is_deleted = false
  LEFT JOIN policies p
    ON p.company_id = c.id AND p.is_deleted = false
`;

function mapCompanyRow(row) {
  if (!row) return null;
  const address = row.address || formatFullAddress(row);
  return {
    ...row,
    address,
  };
}

function buildListFilters({ search, email, status = "all" }) {
  const params = [];
  const conditions = ["c.is_deleted = false"];

  if (status === "active") {
    conditions.push("c.is_active = true");
  } else if (status === "inactive") {
    conditions.push("c.is_active = false");
  }

  if (email) {
    params.push(`%${email}%`);
    conditions.push(`c.email ILIKE $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`c.title ILIKE $${params.length}`);
  }

  return { params, where: conditions.join(" AND ") };
}

function listFromClause() {
  return `
    FROM companies c
    ${ADDRESS_JOIN}
    ${STATS_JOINS}`;
}

async function listActive({ search, limit = 50 } = {}) {
  const params = [];
  let where = "c.is_deleted = false AND c.is_active = true";
  if (search) {
    params.push(`%${search}%`);
    where += ` AND c.title ILIKE $${params.length}`;
  }
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.email, c.phone, c.is_active, c.created_at
       FROM companies c
      WHERE ${where}
      ORDER BY c.title ASC
      LIMIT $${params.length}`,
    params
  );
  return rows;
}

async function list({ search, email, status = "all", page = 1, limit = 10 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const { params, where } = buildListFilters({ search, email, status });

  const countSql = `
    SELECT COUNT(DISTINCT c.id)::int AS total
      FROM companies c
      ${ADDRESS_JOIN}
     WHERE ${where}`;
  const { rows: countRows } = await pool.query(countSql, params);
  const total = countRows[0]?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / safeLimit), total > 0 ? 1 : 0);
  const currentPage = totalPages > 0 ? Math.min(safePage, totalPages) : 1;
  const currentOffset = (currentPage - 1) * safeLimit;

  const listParams = [...params, safeLimit, currentOffset];
  const limitIdx = listParams.length - 1;
  const offsetIdx = listParams.length;

  const { rows } = await pool.query(
    `SELECT ${COMPANY_CORE},
            ${ADDRESS_COALESCE},
            COUNT(DISTINCT u.id)::int AS total_users,
            COUNT(DISTINCT p.id)::int AS total_policies
       ${listFromClause()}
      WHERE ${where}
      GROUP BY c.id, ca.id, ca.address_line_1, ca.city, ca.state, ca.country, ca.pin_code, ca.formatted_address
      ORDER BY c.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    listParams
  );

  return {
    items: rows.map(mapCompanyRow),
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total,
      totalPages,
    },
  };
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${COMPANY_CORE},
            ${ADDRESS_COALESCE},
            COUNT(DISTINCT u.id)::int AS total_users,
            COUNT(DISTINCT p.id)::int AS total_policies
       ${listFromClause()}
      WHERE c.id = $1 AND c.is_deleted = false
      GROUP BY c.id, ca.id, ca.address_line_1, ca.city, ca.state, ca.country, ca.pin_code, ca.formatted_address
      LIMIT 1`,
    [id]
  );
  return mapCompanyRow(rows[0] || null);
}

async function create(
  { title, email, phone, description, isActive = true },
  addressFields = null
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO companies (title, email, phone, description, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, email, phone, is_active, is_deleted, created_at, updated_at`,
      [title, email, phone || null, description || null, isActive]
    );
    const company = rows[0];

    if (addressFields && hasAddressInput(addressFields)) {
      await companyAddressModel.upsertByCompanyId(client, company.id, addressFields);
    }

    await client.query("COMMIT");
    return findById(company.id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function hasAddressInput(fields) {
  return ["address_line_1", "city", "state", "country", "pin_code"].some(
    (k) => fields[k] != null && String(fields[k]).trim() !== ""
  );
}

async function updateById(id, companyFields, addressFields = undefined) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const allowed = {
      title: "title",
      email: "email",
      phone: "phone",
      description: "description",
      isActive: "is_active",
    };
    const sets = [];
    const params = [id];
    let idx = 2;

    for (const [key, column] of Object.entries(allowed)) {
      if (companyFields[key] !== undefined) {
        sets.push(`${column} = $${idx}`);
        params.push(
          companyFields[key] === "" && key !== "title" ? null : companyFields[key]
        );
        idx += 1;
      }
    }

    if (sets.length) {
      await client.query(
        `UPDATE companies SET ${sets.join(", ")}, updated_at = NOW()
          WHERE id = $1 AND is_deleted = false`,
        params
      );
    }

    if (addressFields !== undefined) {
      if (hasAddressInput(addressFields)) {
        await companyAddressModel.upsertByCompanyId(client, id, addressFields);
      } else {
        await client.query(`DELETE FROM company_addresses WHERE company_id = $1`, [id]);
      }
    }

    await client.query("COMMIT");
    return findById(id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function softDelete(id) {
  const { rows } = await pool.query(
    `UPDATE companies
        SET is_deleted = true, is_active = false, updated_at = NOW()
      WHERE id = $1 AND is_deleted = false
      RETURNING id`,
    [id]
  );
  return rows[0] || null;
}

async function emailExists(email, excludeId = null) {
  const params = [email.toLowerCase()];
  let sql = `SELECT id FROM companies WHERE LOWER(email) = $1 AND is_deleted = false`;
  if (excludeId) {
    params.push(excludeId);
    sql += ` AND id <> $2`;
  }
  sql += " LIMIT 1";
  const { rows } = await pool.query(sql, params);
  return rows.length > 0;
}

module.exports = {
  listActive,
  list,
  findById,
  create,
  updateById,
  softDelete,
  emailExists,
};
