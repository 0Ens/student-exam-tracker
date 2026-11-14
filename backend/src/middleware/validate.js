const { z } = require('zod');
const { HttpError } = require('./errors');

// Validates req.body against a Zod schema and replaces it with the parsed value.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const err = new HttpError(400, 'Validation failed');
      err.details = z.flattenError(result.error).fieldErrors;
      return next(err);
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
