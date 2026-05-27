#!/usr/bin/env node
/**
 * Index user activity_logs rows to Elasticsearch (helporbit-audit-logs).
 * Usage:
 *   node scripts/backfill-user-activity-es.js
 *   node scripts/backfill-user-activity-es.js --force
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const pool = require("../src/config/db");
const env = require("../src/config/env");
const userModel = require("../src/models/user.model");
const activityLogModel = require("../src/models/activityLog.model");
const elasticActivity = require("../src/services/elasticCompanyActivity.service");

async function main() {
  if (!env.elastic.enabled) {
    console.error("ELASTIC_ENABLED is not true. Aborting.");
    process.exit(1);
  }

  await elasticActivity.ensureIndex();

  const force = process.argv.includes("--force");
  const sql = force
    ? `SELECT al.* FROM activity_logs al WHERE al.category = 'user' ORDER BY al.occurred_at ASC`
    : `SELECT al.* FROM activity_logs al WHERE al.category = 'user' AND al.es_synced_at IS NULL ORDER BY al.occurred_at ASC`;

  const { rows } = await pool.query(sql);

  if (!rows.length) {
    console.log("No unsynced user activity logs.");
    await pool.end();
    return;
  }

  let synced = 0;
  let failed = 0;

  for (const row of rows) {
    const actorUser = row.actor_user_id ? await userModel.findById(row.actor_user_id) : null;
    const ok = await elasticActivity.indexActivityLog(row, actorUser, {
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
    });
    if (ok) {
      await activityLogModel.markEsSynced(row.id);
      synced += 1;
      console.log(`Synced ${row.id} (${row.action})`);
    } else {
      failed += 1;
      console.warn(`Failed ${row.id} (${row.action})`);
    }
  }

  console.log(`Done. synced=${synced} failed=${failed}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
