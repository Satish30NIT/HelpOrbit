const companyModel = require("../models/company.model");
const companyActivityLog = require("./companyActivityLog.service");
const ApiError = require("../utils/ApiError");

function extractAddressPayload(payload) {
  return {
    address_line_1: payload.address_line_1,
    city: payload.city,
    state: payload.state,
    country: payload.country,
    pin_code: payload.pin_code,
  };
}

function hasAddressInPayload(payload) {
  return ["address_line_1", "city", "state", "country", "pin_code"].some(
    (k) => payload[k] !== undefined
  );
}

async function listForDropdown(query) {
  const search = query.search?.trim() || undefined;
  const companies = await companyModel.listActive({
    search,
    limit: query.limit,
  });
  return { companies };
}

async function listCompanies(query) {
  const search = query.search?.trim() || undefined;
  const email = query.email?.trim() || undefined;
  return companyModel.list({
    search,
    email,
    status: query.status || "all",
    page: query.page,
    limit: query.limit,
  });
}

async function getCompany(id) {
  const company = await companyModel.findById(id);
  if (!company) throw ApiError.notFound("Company not found");
  return company;
}

async function createCompany(payload, activityCtx) {
  const exists = await companyModel.emailExists(payload.email);
  if (exists) throw ApiError.badRequest("A company with this email already exists");

  const company = await companyModel.create(
    {
      title: payload.title,
      email: payload.email,
      phone: payload.phone,
      description: payload.description,
      isActive: payload.is_active ?? true,
    },
    extractAddressPayload(payload)
  );

  if (activityCtx) await companyActivityLog.recordCreated(company, activityCtx);
  return company;
}

async function updateCompany(id, payload, activityCtx) {
  const existing = await companyModel.findById(id);
  if (!existing) throw ApiError.notFound("Company not found");
  const before = { ...existing };

  if (payload.email) {
    const emailTaken = await companyModel.emailExists(payload.email, id);
    if (emailTaken) throw ApiError.badRequest("A company with this email already exists");
  }

  const companyPatch = {};
  if (payload.title !== undefined) companyPatch.title = payload.title;
  if (payload.email !== undefined) companyPatch.email = payload.email;
  if (payload.phone !== undefined) companyPatch.phone = payload.phone || null;
  if (payload.description !== undefined) companyPatch.description = payload.description || null;
  if (payload.is_active !== undefined) companyPatch.isActive = payload.is_active;

  let addressPatch;
  if (hasAddressInPayload(payload)) {
    addressPatch = {
      address_line_1:
        payload.address_line_1 !== undefined
          ? payload.address_line_1
          : existing.address_line_1,
      city: payload.city !== undefined ? payload.city : existing.city,
      state: payload.state !== undefined ? payload.state : existing.state,
      country: payload.country !== undefined ? payload.country : existing.country,
      pin_code: payload.pin_code !== undefined ? payload.pin_code : existing.pin_code,
    };
  }

  const updated = await companyModel.updateById(id, companyPatch, addressPatch);
  if (!updated) throw ApiError.notFound("Company not found");

  if (activityCtx) {
    const changes = companyActivityLog.diffCompany(before, updated, payload);
    await companyActivityLog.recordUpdated(updated, activityCtx, { before, changes });
  }
  return updated;
}

async function deleteCompany(id, activityCtx) {
  const existing = await companyModel.findById(id);
  if (!existing) throw ApiError.notFound("Company not found");

  const deleted = await companyModel.softDelete(id);
  if (!deleted) throw ApiError.notFound("Company not found");

  if (activityCtx) await companyActivityLog.recordDeleted(existing, activityCtx);
  return { id, deleted: true };
}

module.exports = {
  listForDropdown,
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
};
