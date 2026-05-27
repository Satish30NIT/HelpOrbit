const activityLogModel = require("../models/activityLog.model");
const elasticActivity = require("./elasticCompanyActivity.service");
const companyActivityLogService = require("./companyActivityLog.service");
const userActivityLogService = require("./userActivityLog.service");

function mapRow(row) {
  if (!row) return null;
  if (row.category === "user") return userActivityLogService.mapRow(row);
  return companyActivityLogService.mapRow(row);
}

function toIsoDate(value) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function normalizeCategory(raw) {
  const c = String(raw || "all").trim().toLowerCase();
  return c === "company" || c === "user" ? c : "all";
}

async function listActivity(query) {
  const category = normalizeCategory(query.category);
  const companyId = query.company_id?.trim() || undefined;
  const userId = query.user_id ? Number(query.user_id) : undefined;

  if (category === "company" && !userId) {
    return companyActivityLogService.listActivity(query);
  }
  if (category === "user" && !companyId) {
    return userActivityLogService.listActivity(query);
  }

  const fromEs = await elasticActivity.searchAuditActivity({
    category: category === "all" ? undefined : category,
    companyId,
    userId,
    action: query.action?.trim() || undefined,
    actorEmail: query.actor_email?.trim() || undefined,
    search: query.search?.trim() || undefined,
    from: toIsoDate(query.from),
    to: toIsoDate(query.to),
    page: query.page,
    limit: query.limit,
  });
  if (fromEs) {
    return {
      items: fromEs.items.map(mapRow),
      pagination: fromEs.pagination,
      source: fromEs.source,
    };
  }

  const pg = await activityLogModel.listUnifiedActivity({
    category: category === "all" ? undefined : category,
    companyId,
    userId,
    action: query.action?.trim() || undefined,
    actorEmail: query.actor_email?.trim() || undefined,
    search: query.search?.trim() || undefined,
    from: toIsoDate(query.from),
    to: toIsoDate(query.to),
    page: query.page,
    limit: query.limit,
  });

  return {
    items: pg.items.map(mapRow),
    pagination: pg.pagination,
    source: "postgres",
  };
}

async function getActivityStats(query) {
  const category = normalizeCategory(query.category);
  if (category === "company") {
    return activityLogModel.getCompanyActivityStats(query.from, query.to);
  }
  if (category === "user") {
    return activityLogModel.getUserActivityStats(query.from, query.to);
  }
  return activityLogModel.getUnifiedActivityStats(query.from, query.to);
}

async function listActors() {
  return activityLogModel.listUnifiedDistinctActors();
}

async function getLogDocument(logId) {
  return companyActivityLogService.getLogDocument(logId);
}

module.exports = {
  listActivity,
  getActivityStats,
  listActors,
  getLogDocument,
};
