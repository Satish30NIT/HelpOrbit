require("dotenv").config();

const required = ["DB_USER", "DB_HOST", "DB_NAME", "DB_PASSWORD", "DB_PORT", "JWT_SECRET"];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.warn(
    `[env] Missing variables: ${missing.join(", ")}. Some features may not work.`
  );
}

module.exports = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "change-me-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  corsOrigin: process.env.CORS_ORIGIN || "*",
};
