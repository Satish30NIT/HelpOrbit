const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");

function authenticate(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(ApiError.unauthorized("Missing or malformed Authorization header"));
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Token expired"));
    }
    return next(ApiError.unauthorized("Invalid token"));
  }
}

/**
 * Restrict a route to specific role names. Use after `authenticate`.
 *   router.get("/admin", authenticate, requireRole("admin"), handler)
 */
function requireRole(...allowed) {
  const allowedSet = new Set(allowed.map((r) => String(r).toLowerCase()));
  return (req, _res, next) => {
    const role = String(req.user?.roleName || "").toLowerCase();
    if (!role || !allowedSet.has(role)) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
