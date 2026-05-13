const bcrypt = require("bcryptjs");
const userModel = require("../models/user.model");
const ApiError = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");
const env = require("../config/env");
const logger = require("../utils/logger");

const BCRYPT_PREFIX_RE = /^\$2[aby]\$/;

function isBcryptHash(value) {
  return typeof value === "string" && BCRYPT_PREFIX_RE.test(value);
}

/**
 * Verify a candidate password against the stored value.
 * Supports legacy plaintext records: if the stored value is plaintext and
 * matches, we upgrade it to a bcrypt hash transparently.
 */
async function verifyAndUpgrade(user, candidate) {
  const stored = user.password;
  if (!stored) return false;

  if (isBcryptHash(stored)) {
    return bcrypt.compare(candidate, stored);
  }

  // Legacy plaintext path. Compare directly, then upgrade if it matches.
  if (stored === candidate) {
    try {
      const hashed = await bcrypt.hash(candidate, env.bcryptRounds);
      await userModel.updatePassword(user.id, hashed);
      logger.info("Legacy plaintext password upgraded to bcrypt", {
        userId: user.id,
      });
    } catch (err) {
      logger.error("Failed to upgrade plaintext password", {
        userId: user.id,
        error: err.message,
      });
    }
    return true;
  }

  return false;
}

async function login({ identifier, password }) {
  const user = await userModel.findByEmailOrUsername(identifier);
  if (!user) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const ok = await verifyAndUpgrade(user, password);
  if (!ok) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const safeUser = userModel.sanitize(user);
  const token = signToken({
    sub: user.id,
    email: user.email,
    roleId: user.role_id,
    roleName: user.role_name,
  });

  return { token, user: safeUser };
}

module.exports = { login };
