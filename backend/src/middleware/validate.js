const ApiError = require("../utils/ApiError");

/**
 * Build an Express middleware that validates a request property
 * (`body` | `query` | `params`) against a Joi schema.
 *
 *   router.post("/login", validate(loginSchema), handler)
 *   router.get("/x", validate(qSchema, "query"), handler)
 */
function validate(schema, property = "body") {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        path: d.path.join("."),
        message: d.message.replace(/['"]/g, ""),
      }));
      return next(ApiError.badRequest("Validation failed", details));
    }

    req[property] = value;
    next();
  };
}

module.exports = validate;
