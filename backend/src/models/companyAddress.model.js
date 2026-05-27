const pool = require("../config/db");
const { formatFullAddress } = require("../utils/companyAddress");

const ADDRESS_SELECT = `
  ca.id AS address_id,
  ca.company_id,
  ca.address_line_1,
  ca.city,
  ca.state,
  ca.country,
  ca.pin_code,
  ca.formatted_address
`;

function normalizeFields(fields) {
  const address_line_1 = fields.address_line_1?.trim() || null;
  const city = fields.city?.trim() || null;
  const state = fields.state?.trim() || null;
  const country = fields.country?.trim() || null;
  const pin_code = fields.pin_code?.trim() || null;
  const formatted_address = formatFullAddress({
    address_line_1,
    city,
    state,
    country,
    pin_code,
  });
  return { address_line_1, city, state, country, pin_code, formatted_address };
}

async function upsertByCompanyId(client, companyId, fields) {
  const db = client || pool;
  const addr = normalizeFields(fields);

  const { rows } = await db.query(
    `INSERT INTO company_addresses (
       company_id, address_line_1, city, state, country, pin_code, formatted_address
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (company_id)
     DO UPDATE SET
       address_line_1 = EXCLUDED.address_line_1,
       city = EXCLUDED.city,
       state = EXCLUDED.state,
       country = EXCLUDED.country,
       pin_code = EXCLUDED.pin_code,
       formatted_address = EXCLUDED.formatted_address,
       updated_at = NOW()
     RETURNING id, company_id, address_line_1, city, state, country, pin_code, formatted_address`,
    [
      companyId,
      addr.address_line_1,
      addr.city,
      addr.state,
      addr.country,
      addr.pin_code,
      addr.formatted_address,
    ]
  );
  return rows[0] || null;
}

async function findByCompanyId(companyId, client) {
  const db = client || pool;
  const { rows } = await db.query(
    `SELECT id, company_id, address_line_1, city, state, country, pin_code, formatted_address
       FROM company_addresses
      WHERE company_id = $1
      LIMIT 1`,
    [companyId]
  );
  return rows[0] || null;
}

module.exports = {
  ADDRESS_SELECT,
  upsertByCompanyId,
  findByCompanyId,
  normalizeFields,
};
