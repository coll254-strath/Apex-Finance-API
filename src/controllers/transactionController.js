/**
 * ============================================================================
 * TRANSACTION CONTROLLER
 * ============================================================================
 * HTTP request handlers for transaction endpoints
 * Thin layer that delegates to service layer
 */

const transactionService = require('../services/transactionService');
const { HTTP_STATUS } = require('../config/constants');

class TransactionController {
  /**
   * POST /v1/transactions
   * Create new transaction
   */
  async createTransaction(req, res, next) {
    try {
      const transaction = await transactionService.createTransaction(req.body);

      // Log creation for audit trail
      console.log(`[TRANSACTION CREATED] ID: ${transaction.id}, External: ${transaction.externalId}`);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        transaction,
      });
    } catch (error) {
      // Handle duplicate externalId specially
      if (error.code === 'DUPLICATE_EXTERNAL_ID') {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: 'Duplicate Transaction',
          message: error.message,
          existingTransaction: error.existingTransaction,
        });
      }
      next(error);
    }
  }

  /**
   * GET /v1/transactions/:id
   * Get single transaction
   */
  async getTransaction(req, res, next) {
    try {
      const transaction = await transactionService.getTransactionById(req.params.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        transaction,
      });
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * GET /v1/transactions
   * List transactions with filters
   */
  async listTransactions(req, res, next) {
    try {
      const filters = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        status: req.query.status,
        currency: req.query.currency,
      };

      const result = await transactionService.listTransactions(filters);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /v1/transactions/:id
   * Update transaction
   */
  async updateTransaction(req, res, next) {
    try {
      const updates = {
        status: req.body.status,
        metadata: req.body.metadata,
      };

      const transaction = await transactionService.updateTransaction(
        req.params.id,
        updates
      );

      // Log status changes for audit
      if (req.body.status) {
        console.log(`[TRANSACTION UPDATED] ID: ${transaction.id}, Status: ${transaction.status}`);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        transaction,
      });
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.code === 'INVALID_TRANSITION') {
        return res.status(HTTP_STATUS.UNPROCESSABLE).json({
          success: false,
          error: 'Invalid Status Transition',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /v1/transactions/:id
   * Soft delete transaction
   */
  async deleteTransaction(req, res, next) {
    try {
      await transactionService.deleteTransaction(req.params.id);

      console.log(`[TRANSACTION DELETED] ID: ${req.params.id}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }
}

module.exports = new TransactionController();