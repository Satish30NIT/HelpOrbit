const { createLogger, format, transports } = require("winston");
const env = require("../config/env");

const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "helporbit-api", env: env.nodeEnv },
  transports: [new transports.Console({ format: consoleFormat })],
});

// Elasticsearch transport will be wired up in Step 7 (logging integration).

module.exports = logger;
