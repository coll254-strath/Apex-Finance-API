/**
 * ============================================================================
 * APPLICATION CONSTANTS
 * ============================================================================
 * Centralized configuration values and business rules
 */

module.exports = {
  // Supported Currencies (ISO 4217)
  CURRENCIES: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],

  // Transaction Types
  TRANSACTION_TYPES: ['PAYMENT', 'REFUND', 'ADJUSTMENT'],

  // Transaction Statuses
  TRANSACTION_STATUSES: ['PENDING', 'PROCESSING', 'COMPLETE', 'FAILED'],

  // Valid Status Transitions (State Machine)
  STATUS_TRANSITIONS: {
    PENDING: ['PROCESSING', 'FAILED'],
    PROCESSING: ['COMPLETE', 'FAILED'],
    COMPLETE: [], // Terminal state
    FAILED: [], // Terminal state
  },

  // Pagination Limits
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0,
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
};