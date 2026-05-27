const Joi = require("joi");

const uuid = Joi.string().uuid();

const listActivityQuerySchema = Joi.object({
  category: Joi.string().valid("all", "company", "user").default("all"),
  company_id: uuid,
  user_id: Joi.number().integer().positive(),
  action: Joi.string().trim().max(60),
  actor_email: Joi.string().trim().max(150),
  search: Joi.string().trim().max(200),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const activityStatsQuerySchema = Joi.object({
  category: Joi.string().valid("all", "company", "user").default("all"),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
});

const activityLogIdParamSchema = Joi.object({
  logId: uuid.required(),
});

module.exports = {
  listActivityQuerySchema,
  activityStatsQuerySchema,
  activityLogIdParamSchema,
};
