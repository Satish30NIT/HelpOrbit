const express = require("express");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/role.middleware");
const activityLogController = require("../controllers/activityLog.controller");
const {
  listActivityQuerySchema,
  activityStatsQuerySchema,
  activityLogIdParamSchema,
} = require("../validators/activityLog.validator");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get(
  "/stats",
  validate(activityStatsQuerySchema, "query"),
  activityLogController.stats
);
router.get("/actors", activityLogController.actorEmails);
router.get(
  "/:logId",
  validate(activityLogIdParamSchema, "params"),
  activityLogController.getDocument
);
router.get("/", validate(listActivityQuerySchema, "query"), activityLogController.listAll);

module.exports = router;
