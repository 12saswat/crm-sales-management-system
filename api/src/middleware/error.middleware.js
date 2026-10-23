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

  const statusCode = error.statusCode || 500;
  console.error(`[API ERROR ${statusCode}]`, error.message);

  // In production, sanitize 500 internal server errors to avoid leaking system internals
  let clientMessage = error.message;
  if (statusCode >= 500 && config.env === 'production') {
    clientMessage = 'An internal server error occurred. Please try again later.';
  }

  const response = {
    success: false,
    message: clientMessage,
  };

  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  res.status(statusCode).json(response);
};
