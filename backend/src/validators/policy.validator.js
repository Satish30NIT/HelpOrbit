const Joi = require("joi");

const uuid = Joi.string().uuid({ version: "uuidv4" });

const createPolicySchema = Joi.object({
  company_id: uuid.required(),
  policy_name: Joi.string().trim().min(2).max(200).required(),
  title: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().min(1).max(10000).required(),
});

const updatePolicySchema = Joi.object({
  policy_name: Joi.string().trim().min(2).max(200),
  title: Joi.string().trim().min(2).max(200),
  description: Joi.string().trim().min(1).max(10000),
  is_active: Joi.boolean(),
})
  .min(1)
  .messages({ "object.min": "At least one field is required to update" });

const policyIdParamSchema = Joi.object({
  id: uuid.required(),
});

const listPoliciesQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow(""),
  company_id: uuid,
  status: Joi.string()
    .valid("all", "pending", "complete", "unassigned")
    .default("all"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const userIdBodySchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
});

const companyListQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow(""),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

module.exports = {
  createPolicySchema,
  updatePolicySchema,
  policyIdParamSchema,
  listPoliciesQuerySchema,
  userIdBodySchema,
  companyListQuerySchema,
};
