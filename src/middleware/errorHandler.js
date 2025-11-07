'use strict';

function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation failed';
  }

  if (err.name === 'UnauthorizedError') {
    error.status = 401;
    error.message = 'Unauthorized';
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    error.status = 409;
    error.message = 'Resource already exists';
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    error.status = 400;
    error.message = 'Invalid reference';
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;