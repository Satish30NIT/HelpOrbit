const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/user.service");
const userActivityController = require("./userActivity.controller");
const { buildActivityContext } = require("../utils/activityContext");

const list = asyncHandler(async (req, res) => {
  const data = await userService.listUsers(req.query);
  res.json({ success: true, data });
});

const listRoles = asyncHandler(async (req, res) => {
  const roles = await userService.listRoles();
  res.json({ success: true, data: { roles } });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.json({ success: true, data: { user } });
});

const create = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, buildActivityContext(req));
  res.status(201).json({ success: true, message: "User created", data: { user } });
});

const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(
    req.params.id,
    req.body,
    buildActivityContext(req)
  );
  res.json({ success: true, message: "User updated", data: { user } });
});

const remove = asyncHandler(async (req, res) => {
  const data = await userService.deleteUser(req.params.id, buildActivityContext(req));
  res.json({ success: true, message: "User deleted", data });
});

const syncCompanies = asyncHandler(async (req, res) => {
  const user = await userService.syncUserCompanies(
    req.params.id,
    req.body.company_ids,
    buildActivityContext(req)
  );
  res.json({ success: true, message: "Company mapping updated", data: { user } });
});

module.exports = {
  list,
  listRoles,
  getOne,
  create,
  update,
  remove,
  syncCompanies,
  listActivityLogs: userActivityController.listAll,
  listUserActivityLogs: userActivityController.listForUser,
  activityLogStats: userActivityController.stats,
  activityLogActors: userActivityController.actorEmails,
  getActivityLogDocument: userActivityController.getDocument,
};
