#!/usr/bin/env node
/**
 * Index company activity_logs rows to Elasticsearch (helporbit-audit-logs).
 * Usage:
 *   node scripts/backfill-company-activity-es.js
 *   node scripts/backfill-company-activity-es.js --force   # re-index all company logs
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
    ? `SELECT al.* FROM activity_logs al WHERE al.category = 'company' ORDER BY al.occurred_at ASC`
    : `SELECT al.* FROM activity_logs al WHERE al.category = 'company' AND al.es_synced_at IS NULL ORDER BY al.occurred_at ASC`;

  const { rows } = await pool.query(sql);

  if (!rows.length) {
    console.log("No unsynced company activity logs.");
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
      console.error(`Failed ${row.id} (${row.action})`);
    }
  }

  console.log(`Done: ${synced} synced, ${failed} failed, ${rows.length} total`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
