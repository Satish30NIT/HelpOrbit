const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const env = require("../config/env");
const userModel = require("../models/user.model");
const userCompanyModel = require("../models/userCompany.model");
const userActivityLog = require("./userActivityLog.service");
const ApiError = require("../utils/ApiError");

function normalizePayload(body) {
  return {
    firstName: body.first_name?.trim(),
    middleName: body.middle_name?.trim() || null,
    lastName: body.last_name?.trim(),
    userName: body.user_name?.trim(),
    email: body.email?.trim().toLowerCase(),
    phone: body.phone?.trim() || null,
    roleId: body.role_id,
    isActive: body.is_active,
    companyIds: body.company_ids || [],
    password: body.password,
  };
}

async function listUsers(query) {
  return userModel.list({
    search: query.search,
    email: query.email,
    companyId: query.company_id || undefined,
    status: query.status,
    roleId: query.role_id,
    page: query.page,
    limit: query.limit,
  });
}

async function getUser(id) {
  const user = await userModel.findById(id);
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

async function listRoles() {
  return userModel.listRoles();
}

async function createUser(body, activityCtx) {
  const p = normalizePayload(body);

  if (await userModel.emailExists(p.email)) {
    throw ApiError.badRequest("A user with this email already exists");
  }
  if (await userModel.usernameExists(p.userName)) {
    throw ApiError.badRequest("This username is already taken");
  }

  const passwordHash = await bcrypt.hash(p.password, env.bcryptRounds);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userId = await userModel.create(
      {
        firstName: p.firstName,
        middleName: p.middleName,
        lastName: p.lastName,
        userName: p.userName,
        email: p.email,
        phone: p.phone,
        passwordHash,
        roleId: p.roleId ?? 1,
        isActive: p.isActive,
      },
      client
    );
    await userCompanyModel.syncCompanies(client, userId, p.companyIds);
    await client.query("COMMIT");
    const user = await userModel.findById(userId);
    if (activityCtx) await userActivityLog.recordCreated(user, activityCtx);
    return user;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function updateUser(id, body, activityCtx) {
  const existing = await userModel.findById(id);
  if (!existing) throw ApiError.notFound("User not found");
  const before = { ...existing };
  const p = normalizePayload(body);

  if (p.email && (await userModel.emailExists(p.email, id))) {
    throw ApiError.badRequest("A user with this email already exists");
  }
  if (p.userName && (await userModel.usernameExists(p.userName, id))) {
    throw ApiError.badRequest("This username is already taken");
  }

  let passwordHash;
  if (p.password && p.password.length >= 6) {
    passwordHash = await bcrypt.hash(p.password, env.bcryptRounds);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await userModel.updateById(id, {
      firstName: p.firstName,
      middleName: p.middleName,
      lastName: p.lastName,
      userName: p.userName,
      email: p.email,
      phone: p.phone,
      passwordHash,
      roleId: p.roleId,
      isActive: p.isActive,
    });

    let companiesChanged = false;
    if (body.company_ids !== undefined) {
      const prevIds = (before.companies || []).map((c) => c.id).sort().join(",");
      const nextIds = [...p.companyIds].sort().join(",");
      companiesChanged = prevIds !== nextIds;
      await userCompanyModel.syncCompanies(client, id, p.companyIds);
    }

    await client.query("COMMIT");
    const user = await userModel.findById(id);
    const changes = userActivityLog.diffFields(before, user, body);
    if (activityCtx && (changes.length || companiesChanged || Object.keys(body).length)) {
      await userActivityLog.recordUpdated(user, activityCtx, {
        before,
        changes,
        companiesChanged,
      });
    }
    return user;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function deleteUser(id, activityCtx) {
  const existing = await userModel.findById(id);
  if (!existing) throw ApiError.notFound("User not found");

  const deleted = await userModel.softDelete(id);
  if (!deleted) throw ApiError.notFound("User not found");

  if (activityCtx) await userActivityLog.recordDeleted(existing, activityCtx);
  return { id, deleted: true };
}

async function syncUserCompanies(id, companyIds, activityCtx) {
  const before = await userModel.findById(id);
  if (!before) throw ApiError.notFound("User not found");

  await userCompanyModel.syncCompanies(null, id, companyIds);
  const user = await userModel.findById(id);

  if (activityCtx) {
    await userActivityLog.recordUpdated(user, activityCtx, {
      before,
      changes: [],
      companiesChanged: true,
    });
  }
  return user;
}

module.exports = {
  listUsers,
  getUser,
  listRoles,
  createUser,
  updateUser,
  deleteUser,
  syncUserCompanies,
};
