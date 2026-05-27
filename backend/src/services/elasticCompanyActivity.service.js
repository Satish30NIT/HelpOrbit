const env = require("../config/env");
const { getElasticClient } = require("../config/elastic");
const logger = require("../utils/logger");
const { buildMetaDataFromRaw } = require("../utils/activityMetaData");

const INDEX = env.elastic.auditLogsIndex;

let indexReady = false;

async function ensureIndex() {
  if (!env.elastic.enabled || indexReady) return;
  const es = getElasticClient();
  if (!es) return;

  const exists = await es.indices.exists({ index: INDEX });
  if (!exists) {
    await es.indices.create({
      index: INDEX,
      settings: { number_of_shards: 1, number_of_replicas: 0 },
      mappings: {
        properties: {
          occurred_at: { type: "date" },
          category: { type: "keyword" },
          action: { type: "keyword" },
          severity: { type: "keyword" },
          message: { type: "text" },
          company_id: { type: "keyword" },
          user_id: { type: "keyword" },
          target_type: { type: "keyword" },
          target_id: { type: "keyword" },
          meta_data: {
            type: "object",
            properties: {
              modified_by: { type: "object", enabled: true },
              request: { type: "object", enabled: true },
              previous_info: { type: "object", enabled: true },
              current_info: { type: "object", enabled: true },
              changes: {
                type: "nested",
                properties: {
                  field: { type: "keyword" },
                  from: { type: "text" },
                  to: { type: "text" },
                },
              },
            },
          },
        },
      },
    });
    logger.info("Elasticsearch index created", { index: INDEX });
  }
  indexReady = true;
}

function parseRowMetadata(row) {
  if (typeof row.metadata === "object" && row.metadata !== null) return row.metadata;
  return JSON.parse(row.metadata || "{}");
}

function toEsDocument(row, actorUser, ctx = {}) {
  const rawMeta = parseRowMetadata(row);
  const meta_data = buildMetaDataFromRaw(rawMeta, row, actorUser, ctx);
  const isUser = row.category === "user" || row.target_type === "user";
  const targetId = row.target_id != null ? String(row.target_id) : null;
  return {
    log_id: row.id,
    company_id: isUser ? null : targetId,
    user_id: isUser ? targetId : null,
    target_type: row.target_type || (isUser ? "user" : "company"),
    target_id: targetId,
    occurred_at: row.occurred_at,
    category: row.category,
    action: row.action,
    severity: row.severity,
    message: row.message,
    meta_data,
  };
}

function mapHitToListRow(hit) {
  const src = hit._source;
  const meta = src.meta_data || src.metadata || {};
  const modifiedBy = meta.modified_by ?? meta.modify_by ?? meta.changed_by ?? {};
  const request = meta.request || {};
  const isUser = src.category === "user" || src.target_type === "user";
  const targetId = isUser
    ? String(src.user_id ?? src.target_id ?? "")
    : String(src.company_id ?? src.target_id ?? "");
  const targetLabel = isUser
    ? meta.current_info?.display_name ??
      meta.current_info?.user_name ??
      meta.previous_info?.display_name ??
      meta.previous_info?.user_name ??
      src.target_label ??
      null
    : meta.current_info?.title ?? meta.previous_info?.title ?? src.target_label ?? null;

  return {
    id: src.log_id || hit._id,
    occurred_at: src.occurred_at,
    category: src.category,
    action: src.action,
    severity: src.severity,
    message: src.message,
    actor_user_id: modifiedBy.user_id ?? modifiedBy.id ?? src.actor_user_id ?? null,
    actor_email: modifiedBy.email ?? src.actor_email ?? null,
    actor_role: modifiedBy.role ?? src.actor_role ?? null,
    actor_user_name: modifiedBy.username ?? modifiedBy.user_name ?? null,
    actor_first_name: null,
    actor_middle_name: null,
    actor_last_name: null,
    actor_display_name:
      modifiedBy.display_name ?? modifiedBy.name ?? src.actor_display_name ?? null,
    target_type: isUser ? "user" : "company",
    target_id: targetId || null,
    target_label: targetLabel,
    ip_address: request.ip_address ?? src.ip_address ?? null,
    user_agent: request.user_agent ?? src.user_agent ?? null,
    metadata: meta,
    es_synced_at: src.occurred_at,
    source: "elasticsearch",
  };
}

async function indexActivityLog(row, actorUser, ctx = {}) {
  if (!env.elastic.enabled) return false;
  try {
    await ensureIndex();
    const es = getElasticClient();
    if (!es) return false;

    const doc = toEsDocument(row, actorUser, ctx);
    await es.index({
      index: INDEX,
      id: row.id,
      document: doc,
      refresh: env.nodeEnv !== "production",
    });
    return true;
  } catch (err) {
    logger.error("Failed to index activity log in Elasticsearch", {
      logId: row.id,
      error: err.message,
    });
    return false;
  }
}

function buildActorEmailClause(actorEmail) {
  return {
    bool: {
      should: [
        {
          wildcard: {
            "meta_data.modified_by.email": {
              value: `*${actorEmail}*`,
              case_insensitive: true,
            },
          },
        },
        {
          match: {
            "meta_data.modified_by.display_name": { query: actorEmail, operator: "and" },
          },
        },
        {
          wildcard: {
            "meta_data.modify_by.email": { value: `*${actorEmail}*`, case_insensitive: true },
          },
        },
        { wildcard: { actor_email: { value: `*${actorEmail}*`, case_insensitive: true } } },
      ],
      minimum_should_match: 1,
    },
  };
}

function buildSearchFields(category) {
  const common = [
    "message",
    "meta_data.modified_by.email",
    "meta_data.modified_by.display_name",
    "meta_data.modify_by.email",
    "actor_email",
  ];
  if (category === "user") {
    return [
      ...common,
      "meta_data.current_info.display_name",
      "meta_data.current_info.user_name",
      "meta_data.current_info.email",
      "meta_data.previous_info.display_name",
      "meta_data.previous_info.user_name",
      "meta_data.previous_info.email",
    ];
  }
  if (category === "company") {
    return [
      ...common,
      "meta_data.current_info.title",
      "meta_data.previous_info.title",
    ];
  }
  return [
    ...common,
    "meta_data.current_info.title",
    "meta_data.previous_info.title",
    "meta_data.current_info.display_name",
    "meta_data.current_info.user_name",
    "meta_data.current_info.email",
    "meta_data.previous_info.display_name",
    "meta_data.previous_info.user_name",
  ];
}

async function searchAuditActivity({
  category,
  companyId,
  userId,
  action,
  actorEmail,
  search,
  from,
  to,
  page = 1,
  limit = 20,
}) {
  if (!env.elastic.enabled) return null;

  await ensureIndex();
  const es = getElasticClient();
  if (!es) return null;

  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safePage = Math.max(1, Number(page) || 1);
  const fromOffset = (safePage - 1) * safeLimit;

  const must = [];
  const cat = category && category !== "all" ? category : null;
  if (cat) must.push({ term: { category: cat } });

  if (companyId) {
    must.push({
      bool: {
        should: [
          { term: { company_id: companyId } },
          {
            bool: {
              must: [
                { term: { target_type: "company" } },
                { term: { target_id: companyId } },
              ],
            },
          },
        ],
        minimum_should_match: 1,
      },
    });
  }

  if (userId != null && userId !== "") {
    const uid = String(userId);
    must.push({
      bool: {
        should: [
          { term: { user_id: uid } },
          {
            bool: {
              must: [{ term: { target_type: "user" } }, { term: { target_id: uid } }],
            },
          },
        ],
        minimum_should_match: 1,
      },
    });
  }

  if (action) must.push({ term: { action } });
  if (actorEmail) must.push(buildActorEmailClause(actorEmail));
  if (search) {
    must.push({
      multi_match: {
        query: search,
        fields: buildSearchFields(cat),
        type: "phrase_prefix",
      },
    });
  }

  const range = {};
  if (from) range.gte = from;
  if (to) range.lte = to;
  if (Object.keys(range).length) {
    must.push({ range: { occurred_at: range } });
  }

  const result = await es.search({
    index: INDEX,
    from: fromOffset,
    size: safeLimit,
    sort: [{ occurred_at: { order: "desc" } }],
    query: must.length ? { bool: { must } } : { match_all: {} },
    track_total_hits: true,
  });

  const total =
    typeof result.hits.total === "number"
      ? result.hits.total
      : result.hits.total?.value ?? 0;

  return {
    items: result.hits.hits.map(mapHitToListRow),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
    source: "elasticsearch",
  };
}

async function searchCompanyActivity(filters) {
  return searchAuditActivity({ ...filters, category: "company" });
}

async function searchUserActivity(filters) {
  return searchAuditActivity({ ...filters, category: "user" });
}

async function getDocumentById(logId) {
  if (!env.elastic.enabled) return null;
  try {
    await ensureIndex();
    const es = getElasticClient();
    if (!es) return null;
    const res = await es.get({ index: INDEX, id: logId });
    return {
      source: "elasticsearch",
      index: res._index,
      id: res._id,
      document: res._source,
    };
  } catch (err) {
    if (err.meta?.statusCode === 404) return null;
    throw err;
  }
}

module.exports = {
  ensureIndex,
  indexActivityLog,
  searchCompanyActivity,
  searchUserActivity,
  searchAuditActivity,
  getDocumentById,
  toEsDocument,
  INDEX,
};
