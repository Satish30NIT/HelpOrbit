const pool = require("../config/db");

async function getAdminStats() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM companies WHERE is_deleted = false) AS companies,
      (SELECT COUNT(*)::int FROM users WHERE is_deleted = false) AS users,
      (SELECT COUNT(*)::int FROM policies WHERE is_deleted = false) AS policies,
      (
        SELECT COUNT(*)::int
          FROM policy_acknowledgements pa
          INNER JOIN policies p ON p.id = pa.policy_id
         WHERE pa.is_acknowledged = false
           AND p.is_deleted = false
      ) AS pending_acknowledgements
  `);
  return rows[0];
}

module.exports = { getAdminStats };
