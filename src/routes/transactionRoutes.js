/**
 * ============================================================================
 * TRANSACTION ROUTES
 * ============================================================================
 * Defines HTTP routes with validation middleware
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const {
  createTransactionValidation,
  updateTransactionValidation,
  transactionIdValidation,
  listTransactionsValidation,
} = require('../middleware/validators');

/**
 * POST /v1/transactions
 * Create new transaction
 */
router.post(
  '/',
  createTransactionValidation,
  transactionController.createTransaction
);

/**
 * GET /v1/transactions
 * List all transactions with pagination/filters
 */
router.get(
  '/',
  listTransactionsValidation,
  transactionController.listTransactions
);

/**
 * GET /v1/transactions/:id
 * Get single transaction
 */
router.get(
  '/:id',
  transactionIdValidation,
  transactionController.getTransaction
);

/**
 * PATCH /v1/transactions/:id
 * Update transaction
 */
router.patch(
  '/:id',
  updateTransactionValidation,
  transactionController.updateTransaction
);

/**
 * DELETE /v1/transactions/:id
 * Soft delete transaction
 */
router.delete(
  '/:id',
  transactionIdValidation,
  transactionController.deleteTransaction
);

module.exports = router;