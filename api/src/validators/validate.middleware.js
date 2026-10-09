import { ApiError } from '../utils/ApiError.js';

/**
 * Creates an Express middleware to validate request target against a Zod schema.
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} source 
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source] || {};
      const parsed = schema.parse(data);
      req[source] = parsed;
      next();
    } catch (error) {
      const issues = error.issues || error.errors;
      if (issues && Array.isArray(issues) && issues.length > 0) {
        const errorMessages = issues.map((err) => err.message);
        const shortMessage = errorMessages[0] || 'Validation Error';
        return next(new ApiError(400, shortMessage, errorMessages));
      }
      return next(new ApiError(400, 'Validation Error'));
    }
  };
};
