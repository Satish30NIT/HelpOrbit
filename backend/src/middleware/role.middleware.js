const { requireRole } = require("./auth.middleware");

/** Restrict route to admin users. Use after `authenticate`. */
const requireAdmin = requireRole("admin");

module.exports = { requireRole, requireAdmin };
