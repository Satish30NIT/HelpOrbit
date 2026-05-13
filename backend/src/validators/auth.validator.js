const Joi = require("joi");

// Accepts either an email or a username in `identifier`.
const loginSchema = Joi.object({
  identifier: Joi.string().trim().min(3).max(150).required().messages({
    "any.required": "identifier (email or username) is required",
  }),
  password: Joi.string().min(1).max(200).required(),
});

module.exports = { loginSchema };
