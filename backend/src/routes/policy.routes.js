const express = require("express");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/role.middleware");
const {
  createPolicySchema,
  updatePolicySchema,
  policyIdParamSchema,
  listPoliciesQuerySchema,
  userIdBodySchema,
} = require("../validators/policy.validator");
const policyController = require("../controllers/policy.controller");

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get("/", validate(listPoliciesQuerySchema, "query"), policyController.list);
router.post("/", validate(createPolicySchema), policyController.create);
router.get(
  "/:id/status",
  validate(policyIdParamSchema, "params"),
  policyController.getStatus
);
router.get(
  "/:id",
  validate(policyIdParamSchema, "params"),
  policyController.getOne
);
router.put(
  "/:id",
  validate(policyIdParamSchema, "params"),
  validate(updatePolicySchema),
  policyController.update
);
router.delete(
  "/:id",
  validate(policyIdParamSchema, "params"),
  policyController.remove
);
router.post(
  "/:id/reset-user",
  validate(policyIdParamSchema, "params"),
  validate(userIdBodySchema),
  policyController.resetUser
);
router.post(
  "/:id/restrict-user",
  validate(policyIdParamSchema, "params"),
  validate(userIdBodySchema),
  policyController.restrictUser
);
router.post(
  "/:id/assign-user",
  validate(policyIdParamSchema, "params"),
  validate(userIdBodySchema),
  policyController.assignUser
);

module.exports = router;
