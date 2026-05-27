const asyncHandler = require("../utils/asyncHandler");
const companyActivityLogService = require("../services/companyActivityLog.service");

const listAll = asyncHandler(async (req, res) => {
  const data = await companyActivityLogService.listActivity(req.query);
  res.json({ success: true, data });
});

const listForCompany = asyncHandler(async (req, res) => {
  const data = await companyActivityLogService.listActivity({
    ...req.query,
    company_id: req.params.id,
  });
  res.json({ success: true, data });
});

const stats = asyncHandler(async (req, res) => {
  const data = await companyActivityLogService.getActivityStats(req.query);
  res.json({ success: true, data });
});

const actorEmails = asyncHandler(async (req, res) => {
  const actors = await companyActivityLogService.listActors();
  res.json({ success: true, data: { actors } });
});

const getDocument = asyncHandler(async (req, res) => {
  const data = await companyActivityLogService.getLogDocument(req.params.logId);
  if (!data) {
    return res.status(404).json({ success: false, message: "Activity log not found" });
  }
  res.json({ success: true, data });
});

module.exports = { listAll, listForCompany, stats, actorEmails, getDocument };
