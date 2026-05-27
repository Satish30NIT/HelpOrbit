const express = require("express");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/role.middleware");
const {
  createCompanySchema,
  updateCompanySchema,
  companyIdParamSchema,
  listCompaniesQuerySchema,
} = require("../validators/company.validator");
const {
  listActivityQuerySchema,
  activityStatsQuerySchema,
  activityLogIdParamSchema,
} = require("../validators/activityLog.validator");
const companyController = require("../controllers/company.controller");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/", validate(listCompaniesQuerySchema, "query"), companyController.list);
router.get(
  "/activity-logs/stats",
  validate(activityStatsQuerySchema, "query"),
  companyController.activityLogStats
);
router.get("/activity-logs/actors", companyController.activityLogActors);
router.get(
  "/activity-logs/:logId",
  validate(activityLogIdParamSchema, "params"),
  companyController.getActivityLogDocument
);
router.get(
  "/activity-logs",
  validate(listActivityQuerySchema, "query"),
  companyController.listActivityLogs
);
router.get("/:id", validate(companyIdParamSchema, "params"), companyController.getOne);
router.get(
  "/:id/activity-logs",
  validate(companyIdParamSchema, "params"),
  validate(listActivityQuerySchema, "query"),
  companyController.listCompanyActivityLogs
);
router.post("/", validate(createCompanySchema), companyController.create);
router.put(
  "/:id",
  validate(companyIdParamSchema, "params"),
  validate(updateCompanySchema),
  companyController.update
);
router.delete(
  "/:id",
  validate(companyIdParamSchema, "params"),
  companyController.remove
);

module.exports = router;
