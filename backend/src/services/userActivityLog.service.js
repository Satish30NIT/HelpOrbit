const env = require("../config/env");
const userModel = require("../models/user.model");
const activityLogModel = require("../models/activityLog.model");
const elasticActivity = require("./elasticCompanyActivity.service");
const {
  buildModifiedBy,
  buildRequest,
  buildMetaDataPayload,
  resolveActorFromMeta,
} = require("../utils/activityMetaData");
const { summarizeUser } = require("../utils/userSummary");
const { userDisplayName } = require("../utils/userDisplayName");
const logger = require("../utils/logger");

const CATEGORY = "user";

function mapRow(row) {
  if (!row) return null;
  const metadata =
    typeof row.metadata === "object" ? row.metadata : JSON.parse(row.metadata || "{}");
  const actor = resolveActorFromMeta(metadata, row);
  const request = metadata.request || {};
  const label =
    metadata.current_info?.display_name ??
    metadata.current_info?.user_name ??
    row.target_label;

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
      label,
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
    target_type: "user",
    target_id: String(entry.userId),
    target_label: entry.userLabel,
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

function diffFields(before, after, payload) {
  const changes = [];
  const fields = [
    ["first_name", "First name"],
    ["last_name", "Last name"],
    ["user_name", "Username"],
    ["email", "Email"],
    ["phone", "Phone"],
    ["role_name", "Role"],
    ["is_active", "Status"],
  ];
  for (const [key, label] of fields) {
    if (payload[key] === undefined && payload.role_id === undefined) continue;
    const prev = before?.[key];
    const next = after?.[key];
    if (String(prev ?? "") !== String(next ?? "")) {
      changes.push({ field: key, label, previous: prev ?? null, current: next ?? null });
    }
  }
  if (payload.role_id !== undefined && before?.role_id !== after?.role_id) {
    changes.push({
      field: "role_id",
      label: "Role",
      previous: before?.role_name ?? before?.role_id,
      current: after?.role_name ?? after?.role_id,
    });
  }
  return changes;
}

async function recordCreated(user, ctx) {
  try {
    const label = userDisplayName(user);
    return await persistLog(
      {
        action: "user.created",
        userId: user.id,
        userLabel: label,
        message: `User "${label}" was created`,
        metadata: buildMetaDataPayload({
          previousInfo: null,
          currentInfo: summarizeUser(user),
        }),
      },
      ctx
    );
  } catch (err) {
    logger.error("Failed to record user.created activity", { error: err.message });
    return null;
  }
}

function normalizeChangesForMeta(changes) {
  if (!Array.isArray(changes)) return changes;
  return changes.map((c) => ({
    field: c.field,
    from: c.from ?? c.previous,
    to: c.to ?? c.current,
  }));
}

async function recordUpdated(user, ctx, { before, changes = [], companiesChanged = false }) {
  try {
    const label = userDisplayName(user);
    const meta = buildMetaDataPayload({
      previousInfo: summarizeUser(before),
      currentInfo: summarizeUser(user),
      changes: normalizeChangesForMeta(changes),
    });
    if (companiesChanged) {
      meta.company_mapping = {
        previous: (before?.companies || []).map((c) => c.title),
        current: (user.companies || []).map((c) => c.title),
      };
    }
    return await persistLog(
      {
        action: "user.updated",
        userId: user.id,
        userLabel: label,
        message: `User "${label}" was updated`,
        metadata: meta,
      },
      ctx
    );
  } catch (err) {
    logger.error("Failed to record user.updated activity", { error: err.message });
    return null;
  }
}

async function recordDeleted(user, ctx) {
  try {
    const label = userDisplayName(user);
    return await persistLog(
      {
        action: "user.deleted",
        userId: user.id,
        userLabel: label,
        message: `User "${label}" was deleted`,
        severity: "warning",
        metadata: buildMetaDataPayload({
          previousInfo: summarizeUser(user),
          currentInfo: null,
        }),
      },
      ctx
    );
  } catch (err) {
    logger.error("Failed to record user.deleted activity", { error: err.message });
    return null;
  }
}

function toIsoDate(value) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

async function listActivity(query) {
  const filters = {
    userId: query.user_id,
    action: query.action?.trim() || undefined,
    actorEmail: query.actor_email?.trim() || undefined,
    search: query.search?.trim() || undefined,
    from: toIsoDate(query.from),
    to: toIsoDate(query.to),
    page: query.page,
    limit: query.limit,
  };

  const fromEs = await elasticActivity.searchUserActivity(filters);
  if (fromEs) {
    return {
      items: fromEs.items.map(mapRow),
      pagination: fromEs.pagination,
      source: fromEs.source,
    };
  }

  const result = await activityLogModel.listUserActivity(filters);
  return {
    items: result.items.map(mapRow),
    pagination: result.pagination,
    source: "postgres",
  };
}

async function getActivityStats(query) {
  return activityLogModel.getUserActivityStats(query.from, query.to);
}

async function listActors() {
  return activityLogModel.listUserDistinctActors();
}

async function getLogDocument(logId) {
  const fromEs = await elasticActivity.getDocumentById(logId);
  if (fromEs) return fromEs;

  const row = await activityLogModel.findById(logId);
  if (!row || row.category !== CATEGORY) return null;

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
  diffFields,
  listActivity,
  getActivityStats,
  listActors,
  getLogDocument,
  mapRow,
};
