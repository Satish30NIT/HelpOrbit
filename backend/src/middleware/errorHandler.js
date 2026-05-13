const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const env = require("../config/env");

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode =
    err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  const payload = {
    success: false,
    message: err.message || "Internal server error",
  };
  if (err.details !== undefined) payload.details = err.details;
  if (env.nodeEnv !== "production") payload.stack = err.stack;

  if (statusCode >= 500) {
    logger.error(err.message, {
      stack: err.stack,
      method: req.method,
      url: req.originalUrl,
    });
  } else {
    logger.warn(err.message, {
      statusCode,
      method: req.method,
      url: req.originalUrl,
    });
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
