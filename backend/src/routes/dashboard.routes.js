const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/role.middleware");
const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(authenticate, requireAdmin);
router.get("/stats", dashboardController.stats);

module.exports = router;
