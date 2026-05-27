const asyncHandler = require("../utils/asyncHandler");
const unifiedActivityLogService = require("../services/unifiedActivityLog.service");

const listAll = asyncHandler(async (req, res) => {
  const data = await unifiedActivityLogService.listActivity(req.query);
  res.json({ success: true, data });
});

const stats = asyncHandler(async (req, res) => {
  const data = await unifiedActivityLogService.getActivityStats(req.query);
  res.json({ success: true, data });
});

const actorEmails = asyncHandler(async (req, res) => {
  const actors = await unifiedActivityLogService.listActors();
  res.json({ success: true, data: { actors } });
});

const getDocument = asyncHandler(async (req, res) => {
  const data = await unifiedActivityLogService.getLogDocument(req.params.logId);
  if (!data) {
    return res.status(404).json({ success: false, message: "Activity log not found" });
  }
  res.json({ success: true, data });
});

module.exports = { listAll, stats, actorEmails, getDocument };
