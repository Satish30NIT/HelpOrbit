const app = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");
const pool = require("./config/db");

const server = app.listen(env.port, () => {
  logger.info(`HelpOrbit API listening on port ${env.port} (${env.nodeEnv})`);
});

function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
      logger.info("PostgreSQL pool closed. Bye.");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown", { error: err.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Forced shutdown after 10s timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  shutdown("uncaughtException");
});
