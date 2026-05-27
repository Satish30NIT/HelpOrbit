const pool = require("../config/db");

async function listCompaniesForUser(userId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.email, uc.is_active AS membership_active, uc.created_at AS mapped_at
       FROM user_companies uc
       INNER JOIN companies c ON c.id = uc.company_id AND c.is_deleted = false
      WHERE uc.user_id = $1
      ORDER BY c.title ASC`,
    [userId]
  );
  return rows;
}

async function replaceCompaniesForUser(userId, companyIds, client) {
  const db = client || pool;
  const uniqueIds = [...new Set((companyIds || []).filter(Boolean))];

  await db.query(`DELETE FROM user_companies WHERE user_id = $1`, [userId]);

  for (const companyId of uniqueIds) {
    await db.query(
      `INSERT INTO user_companies (user_id, company_id, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT DO NOTHING`,
      [userId, companyId]
    );
  }

  return listCompaniesForUser(userId);
}

async function syncCompanies(client, userId, companyIds) {
  const db = client || pool;
  const uniqueIds = [...new Set((companyIds || []).filter(Boolean))];

  const { rows: existing } = await db.query(
    `SELECT company_id::text FROM user_companies WHERE user_id = $1`,
    [userId]
  );
  const existingSet = new Set(existing.map((r) => r.company_id));
  const nextSet = new Set(uniqueIds);

  for (const id of uniqueIds) {
    if (!existingSet.has(id)) {
      await db.query(
        `INSERT INTO user_companies (user_id, company_id, is_active)
         VALUES ($1, $2, true)`,
        [userId, id]
      );
    }
  }

  for (const id of existingSet) {
    if (!nextSet.has(id)) {
      await db.query(`DELETE FROM user_companies WHERE user_id = $1 AND company_id = $2`, [
        userId,
        id,
      ]);
    }
  }

  return listCompaniesForUser(userId);
}

module.exports = {
  listCompaniesForUser,
  replaceCompaniesForUser,
  syncCompanies,
};
