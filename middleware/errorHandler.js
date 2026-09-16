const AppError = require('../utils/appError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error in non-test mode
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Global Error Handler] ${err.name || 'Error'}: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }

  // Handle Mongoose CastError (Invalid ID)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid field: ${err.path}`;
    error = new AppError(message, 404);
  }

  // Handle Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value '${value}' for field '${field}'. Please use another value.`;
    error = new AppError(message, 400);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((el) => ({
      field: el.path,
      message: el.message,
    }));
    error = new AppError('Validation failed', 400, errors);
  }

  // Handle JWT error
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid authentication token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Authentication token has expired', 401);
  }

  const response = {
    success: false,
    message: error.message || 'Internal Server Error',
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;
