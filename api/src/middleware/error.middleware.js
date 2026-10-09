import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle default Error or unknown exception
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';

    // Mongoose CastError (e.g. invalid ObjectId)
    if (error.name === 'CastError') {
      statusCode = 400;
      message = `Invalid format for field '${error.path}': ${error.value}`;
    }

    // Mongoose Duplicate Key Error
    if (error.code === 11000) {
      statusCode = 400;
      const field = Object.keys(error.keyValue)[0];
      message = `Duplicate value entered for ${field} field. Value must be unique.`;
    }

    // Mongoose ValidationError
    if (error.name === 'ValidationError') {
      statusCode = 400;
      const errors = Object.values(error.errors).map((el) => el.message);
      message = `Validation Error: ${errors.join(', ')}`;
    }

    // Zod ValidationError
    if (error.name === 'ZodError' || error.issues) {
      statusCode = 400;
      const issues = error.issues || error.errors || [];
      const errorMessages = issues.map((err) => err.message);
      message = errorMessages[0] || 'Validation Error';
      err.errors = errorMessages;
    }

    // Body parser JSON SyntaxError (e.g., trailing characters or multiple JSON objects)
    if (error instanceof SyntaxError && (error.status === 400 || error.statusCode === 400) && 'body' in error) {
      statusCode = 400;
      message = 'Invalid JSON payload. Please ensure your request body contains a single valid JSON object without trailing text or extra characters.';
    }

    // JWT Error
    if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid authentication token';
    }

    if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Authentication token has expired';
    }

    error = new ApiError(statusCode, message, err.errors || []);
  }

  console.error(`[API ERROR ${error.statusCode || 500}]`, error.message);

  const response = {
    success: false,
    message: error.message,
  };

  res.status(error.statusCode || 500).json(response);
};
