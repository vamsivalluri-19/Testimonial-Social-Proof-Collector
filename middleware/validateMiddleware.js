const AppError = require('../utils/appError');

/**
 * Validate request against a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Target request property
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(new AppError('Validation Error', 400, errors));
      }
      // Replace target with parsed/sanitized value
      req[source] = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = validate;
