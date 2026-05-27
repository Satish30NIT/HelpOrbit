const { userDisplayName } = require("./userDisplayName");

function summarizeAddress(company) {
  if (!company) return null;
  const parts = [
    company.address_line_1,
    company.city,
    company.state,
    company.country,
    company.pin_code,
  ].filter(Boolean);
  const full_address = company.address || (parts.length ? parts.join(", ") : null);
  return {
    address_line_1: company.address_line_1 ?? null,
    city: company.city ?? null,
    state: company.state ?? null,
    country: company.country ?? null,
    pin_code: company.pin_code ?? null,
    full_address,
  };
}

function summarizeCompany(company) {
  if (!company) return null;
  return {
    id: company.id,
    title: company.title,
    email: company.email,
    phone: company.phone ?? null,
    description: company.description ?? null,
    is_active: company.is_active,
    address: summarizeAddress(company),
    created_at: company.created_at ?? null,
    updated_at: company.updated_at ?? null,
  };
}

function changesToArray(changes) {
  if (!changes) return [];
  if (Array.isArray(changes)) return changes;
  if (typeof changes !== "object") return [];
  return Object.entries(changes).map(([field, diff]) => ({
    field,
    from: diff?.from,
    to: diff?.to,
  }));
}

function buildModifiedBy(actorUser, ctx, row = {}) {
  const legacy = row.modified_by ?? row.modify_by ?? row.changed_by;
  if (legacy && typeof legacy === "object" && !actorUser && !ctx?.actorUserId) {
    return {
      user_id: legacy.user_id ?? legacy.id ?? null,
      email: legacy.email ?? null,
      username: legacy.username ?? legacy.user_name ?? null,
      display_name: legacy.display_name ?? legacy.name ?? null,
      role: legacy.role ?? null,
    };
  }
  return {
    user_id: actorUser?.id ?? ctx?.actorUserId ?? null,
    email: actorUser?.email ?? ctx?.actorEmail ?? null,
    username: actorUser?.user_name ?? null,
    display_name: actorUser ? userDisplayName(actorUser) : ctx?.actorEmail ?? null,
    role: actorUser?.role_name ?? ctx?.actorRole ?? null,
  };
}

function buildRequest(ctx, row = {}) {
  const req = row.request;
  if (req && typeof req === "object") return req;
  return {
    ip_address: row.ip_address ?? ctx?.ipAddress ?? null,
    user_agent: row.user_agent ?? ctx?.userAgent ?? null,
  };
}

function normalizeCompanyInfo(info) {
  if (!info || typeof info !== "object") return null;
  if (info.address && typeof info.address === "object") {
    return info;
  }
  return {
    id: info.id,
    title: info.title,
    email: info.email,
    phone: info.phone ?? null,
    description: info.description ?? null,
    is_active: info.is_active,
    address: summarizeAddress(info),
    created_at: info.created_at ?? null,
    updated_at: info.updated_at ?? null,
  };
}

function buildMetaDataPayload({
  previousInfo = null,
  currentInfo = null,
  changes = null,
  modifiedBy = null,
  request = null,
}) {
  const meta = {
    previous_info: normalizeCompanyInfo(previousInfo),
    current_info: normalizeCompanyInfo(currentInfo),
    modified_by: modifiedBy,
    request,
  };
  const changeList = changesToArray(changes);
  if (changeList.length > 0) {
    meta.changes = changeList;
  }
  return meta;
}

function buildMetaDataFromRaw(raw, row, actorUser, ctx) {
  const modified_by = buildModifiedBy(actorUser, ctx, raw);
  const request = buildRequest(ctx, { ...row, request: raw.request });

  let previous_info = raw.previous_info ?? null;
  let current_info = raw.current_info ?? null;
  let changes = raw.changes;

  if (!previous_info && !current_info && raw.changes && !Array.isArray(raw.changes)) {
    previous_info = {};
    current_info = {};
    for (const [field, diff] of Object.entries(raw.changes)) {
      previous_info[field] = diff.from;
      current_info[field] = diff.to;
    }
  }

  if (!previous_info && !current_info && raw.company) {
    previous_info = null;
    current_info = raw.company;
  }

  return buildMetaDataPayload({
    previousInfo: previous_info,
    currentInfo: current_info,
    changes,
    modifiedBy: modified_by,
    request,
  });
}

function resolveActorFromMeta(metadata, row) {
  const meta = metadata || {};
  const m = meta.modified_by ?? meta.modify_by ?? meta.changed_by;
  if (m && (m.display_name || m.name || m.email || m.user_id || m.id)) {
    return {
      user_id: m.user_id ?? m.id ?? row.actor_user_id,
      email: m.email ?? row.actor_email,
      user_name: m.username ?? m.user_name ?? row.actor_user_name,
      role: m.role ?? row.actor_role,
      display_name: m.display_name ?? m.name ?? m.email ?? row.actor_email,
    };
  }
  return {
    user_id: row.actor_user_id,
    email: row.actor_email,
    user_name: row.actor_user_name,
    role: row.actor_role,
    display_name: userDisplayName({
      id: row.actor_user_id,
      first_name: row.actor_first_name,
      middle_name: row.actor_middle_name,
      last_name: row.actor_last_name,
      user_name: row.actor_user_name,
      email: row.actor_email,
    }),
  };
}

module.exports = {
  summarizeCompany,
  changesToArray,
  buildModifiedBy,
  buildRequest,
  buildMetaDataPayload,
  buildMetaDataFromRaw,
  resolveActorFromMeta,
};
