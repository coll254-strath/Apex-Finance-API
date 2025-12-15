/**
 * ============================================================================
 * ERROR HANDLING MIDDLEWARE
 * ============================================================================
 * Centralized error processing with Prisma-specific handling
 */

const { Prisma } = require('@prisma/client');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Global error handler middleware
 * Processes all errors and returns consistent error responses
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Prisma-specific errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation Error',
      message: 'Invalid data provided to database',
    });
  }

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: 'Validation Error',
      details: err.details || err.message,
    });
  }

  // Default internal server error
  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    success: false,
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
  });
};

/**
 * Handle Prisma-specific database errors
 */
function handlePrismaError(err, res) {
  switch (err.code) {
    case 'P2002': // Unique constraint violation
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: 'Duplicate Entry',
        message: `A record with this ${err.meta?.target?.[0]} already exists`,
      });

    case 'P2025': // Record not found
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: 'Not Found',
        message: 'The requested resource does not exist',
      });

    case 'P2003': // Foreign key constraint violation
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid Reference',
        message: 'Referenced record does not exist',
      });

    default:
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: 'Database Error',
        message: 'A database error occurred',
      });
  }
}

/**
 * 404 Not Found handler
 * Must be registered after all routes
 */
const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: 'Endpoint Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      'POST /v1/transactions',
      'GET /v1/transactions',
      'GET /v1/transactions/:id',
      'PATCH /v1/transactions/:id',
      'DELETE /v1/transactions/:id',
      'POST /v1/webhooks/transaction-update',
      'GET /health',
    ],
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};