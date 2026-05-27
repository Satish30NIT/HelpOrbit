const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const pool = require("./config/db");
const { pingElastic } = require("./config/elastic");
const logger = require("./utils/logger");
const elasticActivity = require("./services/elasticCompanyActivity.service");
const requestLogger = require("./middleware/requestLogger");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.set("trust proxy", 1);
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get("/", (req, res) => {
  res.json({ name: "HelpOrbit API", status: "running" });
});

app.get("/health", async (req, res) => {
  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: { database: "unknown", elasticsearch: "disabled" },
  };

  try {
    await pool.query("SELECT 1");
    health.services.database = "ok";
  } catch (err) {
    health.status = "degraded";
    health.services.database = "down";
    logger.error("Database health check failed", { error: err.message });
  }

  const es = await pingElastic();
  health.services.elasticsearch = es.status;
  if (es.enabled && es.status !== "ok") {
    health.status = "degraded";
  }

  res.status(health.status === "ok" ? 200 : 503).json(health);
});

if (env.elastic.enabled) {
  elasticActivity.ensureIndex().catch((err) => {
    logger.warn("Elasticsearch company activity index setup skipped", {
      error: err.message,
    });
  });
}

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/companies", require("./routes/company.routes"));
app.use("/api/policies", require("./routes/policy.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/activity-logs", require("./routes/activity.routes"));
// app.use("/api/analytics", require("./routes/analytics.routes"));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
