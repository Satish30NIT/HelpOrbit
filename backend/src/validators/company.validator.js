const Joi = require("joi");

const uuid = Joi.string().uuid({ version: "uuidv4" });

const createCompanySchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  email: Joi.string().trim().email().max(255).required(),
  phone: Joi.string().trim().max(30).allow("", null),
  address_line_1: Joi.string().trim().max(255).allow("", null),
  city: Joi.string().trim().max(100).allow("", null),
  state: Joi.string().trim().max(100).allow("", null),
  country: Joi.string().trim().max(100).allow("", null),
  pin_code: Joi.string().trim().max(20).allow("", null),
  description: Joi.string().trim().max(5000).allow("", null),
  is_active: Joi.boolean().default(true),
});

const updateCompanySchema = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  email: Joi.string().trim().email().max(255),
  phone: Joi.string().trim().max(30).allow("", null),
  address_line_1: Joi.string().trim().max(255).allow("", null),
  city: Joi.string().trim().max(100).allow("", null),
  state: Joi.string().trim().max(100).allow("", null),
  country: Joi.string().trim().max(100).allow("", null),
  pin_code: Joi.string().trim().max(20).allow("", null),
  description: Joi.string().trim().max(5000).allow("", null),
  is_active: Joi.boolean(),
})
  .min(1)
  .messages({ "object.min": "At least one field is required to update" });

const companyIdParamSchema = Joi.object({
  id: uuid.required(),
});

const listCompaniesQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow(""),
  email: Joi.string().trim().max(255).allow(""),
  status: Joi.string().valid("all", "active", "inactive").default("all"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  dropdown: Joi.boolean().truthy("1", "true").falsy("0", "false").default(false),
});

const companyDropdownQuerySchema = Joi.object({
  search: Joi.string().trim().max(200).allow(""),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

module.exports = {
  createCompanySchema,
  updateCompanySchema,
  companyIdParamSchema,
  listCompaniesQuerySchema,
  companyDropdownQuerySchema,
};
