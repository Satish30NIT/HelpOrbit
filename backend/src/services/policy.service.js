const pool = require("../config/db");
const policyModel = require("../models/policy.model");
const companyModel = require("../models/company.model");
const ApiError = require("../utils/ApiError");

function formatUserName(row) {
  const parts = [row.first_name, row.last_name].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return row.user_name || row.email;
}

function mapAcknowledgement(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    user_name: formatUserName(row),
    email: row.email,
    company_name: row.company_name,
    status: row.is_acknowledged ? "acknowledged" : "pending",
    is_assigned: true,
    is_acknowledged: row.is_acknowledged,
    acknowledged_at: row.acknowledged_at,
    created_at: row.created_at,
  };
}

function mapCompanyUserPolicy(row) {
  const isAssigned = row.ack_id != null;
  let status = "restricted";
  if (isAssigned) {
    status = row.is_acknowledged ? "acknowledged" : "pending";
  }
  return {
    id: row.ack_id ? String(row.ack_id) : `user-${row.user_id}`,
    user_id: row.user_id,
    user_name: formatUserName(row),
    email: row.email,
    company_name: row.company_name,
    status,
    is_assigned: isAssigned,
    is_acknowledged: Boolean(row.is_acknowledged),
    acknowledged_at: row.acknowledged_at,
    created_at: row.created_at,
  };
}

async function listPolicies(query) {
  const search = query.search?.trim() || undefined;
  return policyModel.list({
    search,
    companyId: query.company_id,
    status: query.status || "all",
    page: query.page,
    limit: query.limit,
  });
}

async function getPolicy(id) {
  const policy = await policyModel.findById(id);
  if (!policy) throw ApiError.notFound("Policy not found");

  const stats = await policyModel.getStats(id);
  const users = (await policyModel.listAcknowledgements(id)).map(mapAcknowledgement);

  return {
    policy,
    company: {
      id: policy.company_id,
      title: policy.company_name,
      email: policy.company_email,
      phone: policy.company_phone,
      description: policy.company_description,
    },
    statistics: stats,
    assigned_users: users,
  };
}

async function getPolicyStatus(id) {
  const policy = await policyModel.findById(id);
  if (!policy) throw ApiError.notFound("Policy not found");

  const stats = await policyModel.getStats(id);
  const rows = await policyModel.listCompanyUsersForPolicy(id, policy.company_id);
  const users = rows.map(mapCompanyUserPolicy);
  const restricted = users.filter((u) => u.status === "restricted").length;

  return {
    policy_id: id,
    policy_name: policy.policy_name,
    title: policy.title,
    company_id: policy.company_id,
    company_name: policy.company_name,
    total_assigned: stats.total_assigned,
    acknowledged: stats.acknowledged,
    pending: stats.pending,
    restricted,
    users,
    acknowledged_users: users.filter((u) => u.status === "acknowledged"),
    pending_users: users.filter((u) => u.status === "pending"),
    restricted_users: users.filter((u) => u.status === "restricted"),
  };
}

async function createPolicy(payload) {
  const company = await companyModel.findById(payload.company_id);
  if (!company) throw ApiError.badRequest("Company not found or inactive");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const policy = await policyModel.createWithAssignments(client, {
      companyId: payload.company_id,
      policyName: payload.policy_name,
      title: payload.title,
      description: payload.description,
    });
    await client.query("COMMIT");
    return getPolicy(policy.id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function updatePolicy(id, payload) {
  const existing = await policyModel.findById(id);
  if (!existing) throw ApiError.notFound("Policy not found");

  const updated = await policyModel.updateById(id, {
    policyName: payload.policy_name,
    title: payload.title,
    description: payload.description,
    isActive: payload.is_active,
  });
  if (!updated) throw ApiError.notFound("Policy not found");

  return getPolicy(id);
}

async function deletePolicy(id) {
  const deleted = await policyModel.softDelete(id);
  if (!deleted) throw ApiError.notFound("Policy not found");
  return { id, deleted: true };
}

async function resetUserAcknowledgement(policyId, userId) {
  const policy = await policyModel.findById(policyId);
  if (!policy) throw ApiError.notFound("Policy not found");

  const ack = await policyModel.findAcknowledgement(policyId, userId);
  if (!ack) throw ApiError.notFound("User is not assigned to this policy");

  const updated = await policyModel.resetAcknowledgement(policyId, userId);
  if (!updated) throw ApiError.notFound("Acknowledgement record not found");

  return { policy_id: policyId, user_id: userId, reset: true };
}

async function restrictUser(policyId, userId) {
  const policy = await policyModel.findById(policyId);
  if (!policy) throw ApiError.notFound("Policy not found");

  const removed = await policyModel.deleteAcknowledgement(policyId, userId);
  if (!removed) throw ApiError.notFound("User is not assigned to this policy");

  return { policy_id: policyId, user_id: userId, restricted: true };
}

async function assignUser(policyId, userId) {
  const policy = await policyModel.findById(policyId);
  if (!policy) throw ApiError.notFound("Policy not found");

  const belongs = await policyModel.userBelongsToCompany(userId, policy.company_id);
  if (!belongs) {
    throw ApiError.badRequest("User is not an active member of this policy's company");
  }

  const record = await policyModel.assignUser(null, {
    policyId,
    userId,
    companyId: policy.company_id,
  });

  return {
    policy_id: policyId,
    user_id: userId,
    assigned: true,
    acknowledgement: record,
  };
}

module.exports = {
  listPolicies,
  getPolicy,
  getPolicyStatus,
  createPolicy,
  updatePolicy,
  deletePolicy,
  resetUserAcknowledgement,
  restrictUser,
  assignUser,
};
