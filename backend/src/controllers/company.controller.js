const asyncHandler = require("../utils/asyncHandler");
const companyService = require("../services/company.service");
const companyActivityController = require("./companyActivity.controller");
const { buildActivityContext } = require("../utils/activityContext");

const list = asyncHandler(async (req, res) => {
  if (req.query.dropdown) {
    const data = await companyService.listForDropdown(req.query);
    return res.json({ success: true, data });
  }
  const data = await companyService.listCompanies(req.query);
  res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const company = await companyService.getCompany(req.params.id);
  res.json({ success: true, data: { company } });
});

const create = asyncHandler(async (req, res) => {
  const company = await companyService.createCompany(req.body, buildActivityContext(req));
  res.status(201).json({ success: true, message: "Company created", data: { company } });
});

const update = asyncHandler(async (req, res) => {
  const company = await companyService.updateCompany(
    req.params.id,
    req.body,
    buildActivityContext(req)
  );
  res.json({ success: true, message: "Company updated", data: { company } });
});

const remove = asyncHandler(async (req, res) => {
  const data = await companyService.deleteCompany(req.params.id, buildActivityContext(req));
  res.json({ success: true, message: "Company deleted", data });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  listActivityLogs: companyActivityController.listAll,
  listCompanyActivityLogs: companyActivityController.listForCompany,
  activityLogStats: companyActivityController.stats,
  activityLogActors: companyActivityController.actorEmails,
  getActivityLogDocument: companyActivityController.getDocument,
};
