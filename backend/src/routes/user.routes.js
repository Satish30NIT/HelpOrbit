const express = require("express");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/role.middleware");
const {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
  syncCompaniesSchema,
} = require("../validators/user.validator");
const {
  listActivityQuerySchema,
  activityStatsQuerySchema,
  activityLogIdParamSchema,
} = require("../validators/activityLog.validator");
const userController = require("../controllers/user.controller");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/roles", userController.listRoles);
router.get("/", validate(listUsersQuerySchema, "query"), userController.list);
router.get(
  "/activity-logs/stats",
  validate(activityStatsQuerySchema, "query"),
  userController.activityLogStats
);
router.get("/activity-logs/actors", userController.activityLogActors);
router.get(
  "/activity-logs/:logId",
  validate(activityLogIdParamSchema, "params"),
  userController.getActivityLogDocument
);
router.get(
  "/activity-logs",
  validate(listActivityQuerySchema, "query"),
  userController.listActivityLogs
);
router.get("/:id", validate(userIdParamSchema, "params"), userController.getOne);
router.get(
  "/:id/activity-logs",
  validate(userIdParamSchema, "params"),
  validate(listActivityQuerySchema, "query"),
  userController.listUserActivityLogs
);
router.post("/", validate(createUserSchema), userController.create);
router.put(
  "/:id",
  validate(userIdParamSchema, "params"),
  validate(updateUserSchema),
  userController.update
);
router.put(
  "/:id/companies",
  validate(userIdParamSchema, "params"),
  validate(syncCompaniesSchema),
  userController.syncCompanies
);
router.delete("/:id", validate(userIdParamSchema, "params"), userController.remove);

module.exports = router;
