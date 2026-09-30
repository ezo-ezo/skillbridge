const { HttpError } = require('../utils/httpError');

// validate(schema) parses req.body with a zod schema and replaces it with the cleaned value.
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new HttpError(400, details[0] ? `${details[0].field || 'input'}: ${details[0].message}` : 'Invalid input', details));
  }
  req[source] = result.data;
  next();
};

module.exports = { validate };
