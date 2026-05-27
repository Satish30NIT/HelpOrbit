const asyncHandler = require("../utils/asyncHandler");
const userActivityLogService = require("../services/userActivityLog.service");

const listAll = asyncHandler(async (req, res) => {
  const data = await userActivityLogService.listActivity(req.query);
  res.json({ success: true, data });
});

const listForUser = asyncHandler(async (req, res) => {
  const data = await userActivityLogService.listActivity({
    ...req.query,
    user_id: req.params.id,
  });
  res.json({ success: true, data });
});

const stats = asyncHandler(async (req, res) => {
  const data = await userActivityLogService.getActivityStats(req.query);
  res.json({ success: true, data });
});

const actorEmails = asyncHandler(async (req, res) => {
  const actors = await userActivityLogService.listActors();
  res.json({ success: true, data: { actors } });
});

const getDocument = asyncHandler(async (req, res) => {
  const data = await userActivityLogService.getLogDocument(req.params.logId);
  if (!data) {
    return res.status(404).json({ success: false, message: "Activity log not found" });
  }
  res.json({ success: true, data });
});

module.exports = { listAll, listForUser, stats, actorEmails, getDocument };
