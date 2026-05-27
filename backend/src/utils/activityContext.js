function buildActivityContext(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null) ||
    req.ip ||
    req.socket?.remoteAddress ||
    null;

  return {
    ipAddress: ip,
    userAgent: req.get("user-agent") || null,
    actorUserId: req.user?.sub ?? null,
    actorEmail: req.user?.email ?? null,
    actorRole: req.user?.roleName ?? null,
  };
}

module.exports = { buildActivityContext };
