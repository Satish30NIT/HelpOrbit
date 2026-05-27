const Joi = require("joi");

/** Allow dev/test domains (e.g. helporbit.test) — Joi's default TLD list rejects `.test`. */
const emailSchema = Joi.string().trim().email({ tlds: false }).max(255);

const uuid = Joi.string().uuid({ version: "uuidv4" });

const companyIdsSchema = Joi.array().items(uuid).default([]);

const createUserSchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  middle_name: Joi.string().trim().max(100).allow("", null),
  last_name: Joi.string().trim().min(1).max(100).required(),
  user_name: Joi.string().trim().min(2).max(80).required(),
  email: emailSchema.required(),
  phone: Joi.string().trim().max(30).allow("", null),
  password: Joi.string().min(6).max(128).required(),
  role_id: Joi.number().integer().min(1).default(1),
  is_active: Joi.boolean().default(true),
  company_ids: companyIdsSchema,
});

const updateUserSchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100),
  middle_name: Joi.string().trim().max(100).allow("", null),
  last_name: Joi.string().trim().min(1).max(100),
  user_name: Joi.string().trim().min(2).max(80),
  email: emailSchema,
  phone: Joi.string().trim().max(30).allow("", null),
  password: Joi.string().min(6).max(128).allow("", null),
  role_id: Joi.number().integer().min(1),
  is_active: Joi.boolean(),
  company_ids: companyIdsSchema,
})
  .min(1)
  .messages({ "object.min": "At least one field is required to update" });

const userIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const listUsersQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow(""),
  email: Joi.string().trim().max(255).allow(""),
  company_id: uuid.allow(""),
  status: Joi.string().valid("all", "active", "inactive").default("all"),
  role_id: Joi.number().integer().min(1),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const syncCompaniesSchema = Joi.object({
  company_ids: companyIdsSchema.required(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
  syncCompaniesSchema,
};
