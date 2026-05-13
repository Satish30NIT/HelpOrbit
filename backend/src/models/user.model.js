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
  u.created_at
`;

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

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${USER_SELECT}
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function updatePassword(id, hashedPassword) {
  await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [
    hashedPassword,
    id,
  ]);
}

function sanitize(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

module.exports = {
  findByEmail,
  findByUsername,
  findByEmailOrUsername,
  findById,
  updatePassword,
  sanitize,
};
