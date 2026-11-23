const { z } = require('zod');
const { HttpError } = require('./errors');

function validationError(error) {
  const err = new HttpError(400, 'Validation failed');
  err.details = z.flattenError(error).fieldErrors;
  return err;
}

// Validates req.body against a Zod schema and replaces it with the parsed value.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return next(validationError(result.error));
    }
    req.body = result.data;
    next();
  };
}

// Validates the query string. In Express 5 req.query can not be replaced,
// so the parsed value is stored in req.validQuery.
function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query ?? {});
    if (!result.success) {
      return next(validationError(result.error));
    }
    req.validQuery = result.data;
    next();
  };
}

module.exports = { validate, validateQuery };
