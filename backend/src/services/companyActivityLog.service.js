const env = require("../config/env");
const userModel = require("../models/user.model");
const activityLogModel = require("../models/activityLog.model");
const elasticActivity = require("./elasticCompanyActivity.service");
const {
  summarizeCompany,
  buildModifiedBy,
  buildRequest,
  buildMetaDataPayload,
  resolveActorFromMeta,
} = require("../utils/activityMetaData");
const logger = require("../utils/logger");

const CATEGORY = "company";

function mapRow(row) {
  if (!row) return null;
  const metadata =
    typeof row.metadata === "object" ? row.metadata : JSON.parse(row.metadata || "{}");
  const actor = resolveActorFromMeta(metadata, row);
  const request = metadata.request || {};
  const companyLabel =
    metadata.current_info?.title ?? metadata.previous_info?.title ?? row.target_label;

  return {
    id: row.id,
    occurred_at: row.occurred_at,
    category: row.category,
    action: row.action,
    severity: row.severity,
    message: row.message,
    actor,
    target: {
      type: row.target_type,
      id: row.target_id,
      label: companyLabel,
    },
    ip_address: request.ip_address ?? row.ip_address,
    user_agent: request.user_agent ?? row.user_agent,
    metadata,
    es_synced_at: row.es_synced_at,
    source: row.source || "postgres",
  };
}

async function resolveActorUser(ctx) {
  if (!ctx?.actorUserId) return null;
  return userModel.findById(ctx.actorUserId);
}

async function persistLog(entry, ctx) {
  const actorUser = await resolveActorUser(ctx);
  const metadata = {
    ...(entry.metadata || {}),
    modified_by: buildModifiedBy(actorUser, ctx),
    request: buildRequest(ctx),
  };

  const row = await activityLogModel.insert({
    category: CATEGORY,
    action: entry.action,
    severity: entry.severity || "info",
    message: entry.message,
    actor_user_id: ctx?.actorUserId ?? null,
    actor_email: actorUser?.email ?? ctx?.actorEmail ?? null,
    actor_role: actorUser?.role_name ?? ctx?.actorRole ?? null,
    target_type: "company",
    target_id: entry.companyId,
    target_label: entry.companyTitle,
    ip_address: ctx?.ipAddress ?? null,
    user_agent: ctx?.userAgent ?? null,
    metadata,
  });

  const synced = await elasticActivity.indexActivityLog(row, actorUser, ctx);
  if (synced) {
    await activityLogModel.markEsSynced(row.id);
    row.es_synced_at = new Date();
  }

  return mapRow({
    ...row,
    actor_user_name: actorUser?.user_name ?? null,
    actor_first_name: actorUser?.first_name ?? null,
    actor_middle_name: actorUser?.middle_name ?? null,
    actor_last_name: actorUser?.last_name ?? null,
  });
}

async function recordCreated(company, ctx) {
  try {
    return await persistLog(
      {
        action: "company.created",
        companyId: company.id,
        companyTitle: company.title,
        message: `Company "${company.title}" was created`,
        metadata: buildMetaDataPayload({
          previousInfo: null,
          currentInfo: summarizeCompany(company),
        }),
      },
      ctx
    );
  } catch (err) {
    logger.error("Failed to record company.created activity", { error: err.message });
    return null;
  }
}

async function recordUpdated(company, ctx, { before, changes = {} } = {}) {
  try {
    return await persistLog(
      {
        action: "company.updated",
        companyId: company.id,
        companyTitle: company.title,
        message: `Company "${company.title}" was updated`,
        metadata: buildMetaDataPayload({
          previousInfo: summarizeCompany(before),
          currentInfo: summarizeCompany(company),
          changes,
        }),
      },
      ctx
    );
  } catch (err) {
    logger.error("Failed to record company.updated activity", { error: err.message });
    return null;
  }
}

async function recordDeleted(company, ctx) {
  try {
    const snapshot = summarizeCompany(company);
    return await persistLog(
      {
        action: "company.deleted",
        severity: "warning",
        companyId: company.id,
        companyTitle: company.title,
        message: `Company "${company.title}" was deleted`,
        metadata: buildMetaDataPayload({
          previousInfo: snapshot,
          currentInfo: snapshot ? { ...snapshot, is_active: false } : null,
          changes: [{ field: "is_active", from: company.is_active, to: false }],
        }),
      },
      ctx
    );
  } catch (err) {
    logger.error("Failed to record company.deleted activity", { error: err.message });
    return null;
  }
}

function diffCompany(before, after, payload) {
  const changes = {};
  const fields = ["title", "email", "phone", "description", "is_active"];
  for (const field of fields) {
    if (payload[field] !== undefined && before[field] !== after[field]) {
      changes[field] = { from: before[field], to: after[field] };
    }
  }
  const addressFields = ["address_line_1", "city", "state", "country", "pin_code"];
  for (const field of addressFields) {
    if (payload[field] !== undefined && before[field] !== after[field]) {
      changes[field] = { from: before[field], to: after[field] };
    }
  }
  return changes;
}

function toIsoDate(value) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

async function listActivity(query) {
  const filters = {
    companyId: query.company_id,
    action: query.action?.trim() || undefined,
    actorEmail: query.actor_email?.trim() || undefined,
    search: query.search?.trim() || undefined,
    from: toIsoDate(query.from),
    to: toIsoDate(query.to),
    page: query.page,
    limit: query.limit,
  };

  const fromEs = await elasticActivity.searchCompanyActivity(filters);
  if (fromEs) {
    return {
      items: fromEs.items.map((row) => {
        const metadata = row.metadata || {};
        const request = metadata.request || {};
        return {
          id: row.id,
          occurred_at: row.occurred_at,
          category: row.category,
          action: row.action,
          severity: row.severity,
          message: row.message,
          actor: resolveActorFromMeta(metadata, row),
          target: {
            type: "company",
            id: row.target_id,
            label:
              metadata.current_info?.title ??
              metadata.previous_info?.title ??
              row.target_label,
          },
          ip_address: request.ip_address ?? row.ip_address,
          user_agent: request.user_agent ?? row.user_agent,
          metadata,
          es_synced_at: row.es_synced_at,
          source: "elasticsearch",
        };
      }),
      pagination: fromEs.pagination,
      source: fromEs.source,
    };
  }

  const pg = await activityLogModel.listCompanyActivity(filters);
  return {
    items: pg.items.map(mapRow),
    pagination: pg.pagination,
    source: "postgres",
  };
}

async function getActivityStats(query) {
  return activityLogModel.getCompanyActivityStats(query.from, query.to);
}

async function listActors() {
  return activityLogModel.listDistinctActors();
}

async function getLogDocument(logId) {
  const fromEs = await elasticActivity.getDocumentById(logId);
  if (fromEs) return fromEs;

  const row = await activityLogModel.findById(logId);
  if (!row) return null;

  const actorUser = row.actor_user_id ? await userModel.findById(row.actor_user_id) : null;
  return {
    source: "postgres",
    index: env.elastic.auditLogsIndex,
    id: row.id,
    document: elasticActivity.toEsDocument(row, actorUser, {
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
    }),
    note: "Reconstructed from PostgreSQL (not yet indexed or Elasticsearch unavailable)",
  };
}

module.exports = {
  recordCreated,
  recordUpdated,
  recordDeleted,
  listActivity,
  getActivityStats,
  listActors,
  getLogDocument,
  diffCompany,
  mapRow,
};
