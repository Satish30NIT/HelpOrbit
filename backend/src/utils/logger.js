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

const loggerTransports = [new transports.Console({ format: consoleFormat })];

if (env.elastic.enabled) {
  try {
    const { ElasticsearchTransport } = require("winston-elasticsearch");
    loggerTransports.push(
      new ElasticsearchTransport({
        level: "info",
        clientOpts: { node: env.elastic.url },
        index: env.elastic.appLogIndex,
      })
    );
  } catch (err) {
    console.warn("[logger] Winston Elasticsearch transport unavailable:", err.message);
  }
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: { service: "helporbit-api", env: env.nodeEnv },
  transports: loggerTransports,
});

module.exports = logger;
