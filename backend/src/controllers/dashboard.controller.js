const asyncHandler = require("../utils/asyncHandler");
const dashboardModel = require("../models/dashboard.model");

const stats = asyncHandler(async (_req, res) => {
  const data = await dashboardModel.getAdminStats();
  res.json({ success: true, data });
});

module.exports = { stats };
