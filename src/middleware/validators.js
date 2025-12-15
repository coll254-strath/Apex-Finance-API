/**
 * ============================================================================
 * REQUEST VALIDATION MIDDLEWARE
 * ============================================================================
 * Uses express-validator for robust input validation
 */

const { body, param, query, validationResult } = require('express-validator');
const {
  CURRENCIES,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
  PAGINATION,
} = require('../config/constants');

/**
 * Middleware to check validation results
 * Returns 400 if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

/**
 * Validation rules for creating a transaction
 */
const createTransactionValidation = [
  body('externalId')
    .trim()
    .notEmpty()
    .withMessage('externalId is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('externalId must be between 3 and 255 characters'),

  body('amount')
    .isInt({ min: 1 })
    .withMessage('amount must be a positive integer (cents)'),

  body('currency')
    .trim()
    .toUpperCase()
    .isIn(CURRENCIES)
    .withMessage(`currency must be one of: ${CURRENCIES.join(', ')}`),

  body('type')
    .trim()
    .toUpperCase()
    .isIn(TRANSACTION_TYPES)
    .withMessage(`type must be one of: ${TRANSACTION_TYPES.join(', ')}`),

  body('metadata').optional().isObject().withMessage('metadata must be an object'),

  validate,
];

/**
 * Validation rules for updating a transaction
 */
const updateTransactionValidation = [
  param('id').isInt({ min: 1 }).withMessage('Transaction ID must be a positive integer'),

  body('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(TRANSACTION_STATUSES)
    .withMessage(`status must be one of: ${TRANSACTION_STATUSES.join(', ')}`),

  body('metadata').optional().isObject().withMessage('metadata must be an object'),

  body()
    .custom((value) => {
      const allowedFields = ['status', 'metadata'];
      const providedFields = Object.keys(value);
      const invalidFields = providedFields.filter((f) => !allowedFields.includes(f));
      
      if (invalidFields.length > 0) {
        throw new Error(`Invalid fields: ${invalidFields.join(', ')}`);
      }
      return true;
    }),

  validate,
];

/**
 * Validation rules for transaction ID parameter
 */
const transactionIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Transaction ID must be a positive integer'),

  validate,
];

/**
 * Validation rules for listing transactions (query params)
 */
const listTransactionsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION.MAX_LIMIT })
    .withMessage(`limit must be between 1 and ${PAGINATION.MAX_LIMIT}`),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a non-negative integer'),

  query('status')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(TRANSACTION_STATUSES)
    .withMessage(`status must be one of: ${TRANSACTION_STATUSES.join(', ')}`),

  query('currency')
    .optional()
    .trim()
    .toUpperCase()
    .isIn(CURRENCIES)
    .withMessage(`currency must be one of: ${CURRENCIES.join(', ')}`),

  validate,
];

/**
 * Validation rules for webhook events
 */
const webhookValidation = [
  body('eventId')
    .trim()
    .notEmpty()
    .withMessage('eventId is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('eventId must be between 3 and 255 characters'),

  body('transactionId')
    .isInt({ min: 1 })
    .withMessage('transactionId must be a positive integer'),

  body('status')
    .trim()
    .toUpperCase()
    .isIn(TRANSACTION_STATUSES)
    .withMessage(`status must be one of: ${TRANSACTION_STATUSES.join(', ')}`),

  body('eventType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('eventType cannot be empty'),

  validate,
];

module.exports = {
  createTransactionValidation,
  updateTransactionValidation,
  transactionIdValidation,
  listTransactionsValidation,
  webhookValidation,
};