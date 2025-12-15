/**
 * ============================================================================
 * TRANSACTION SERVICE
 * ============================================================================
 * Business logic layer for transaction operations
 * Separates database access from HTTP handling
 */

const prisma = require('../config/database');
const { STATUS_TRANSITIONS, PAGINATION } = require('../config/constants');

class TransactionService {
  /**
   * Create a new transaction
   * Handles idempotency via externalId
   */
  async createTransaction(data) {
    // Check for existing transaction with same externalId
    const existing = await prisma.transaction.findUnique({
      where: { externalId: data.externalId },
    });

    if (existing && existing.isActive) {
      const error = new Error('Transaction with this externalId already exists');
      error.code = 'DUPLICATE_EXTERNAL_ID';
      error.statusCode = 409;
      error.existingTransaction = existing;
      throw error;
    }

    // Create new transaction
    const transaction = await prisma.transaction.create({
      data: {
        externalId: data.externalId,
        amount: data.amount,
        currency: data.currency,
        type: data.type,
        status: 'PENDING',
        metadata: data.metadata || {},
      },
    });

    return transaction;
  }

  /**
   * Get transaction by ID
   * Only returns active transactions
   */
  async getTransactionById(id) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: parseInt(id),
        isActive: true,
      },
    });

    if (!transaction) {
      const error = new Error('Transaction not found');
      error.code = 'NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    return transaction;
  }

  /**
   * List transactions with pagination and filters
   */
  async listTransactions(filters = {}) {
    const {
      limit = PAGINATION.DEFAULT_LIMIT,
      offset = PAGINATION.DEFAULT_OFFSET,
      status,
      currency,
    } = filters;

    // Build where clause
    const where = { isActive: true };
    if (status) where.status = status;
    if (currency) where.currency = currency;

    // Execute queries in parallel
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update transaction
   * Validates status transitions
   */
  async updateTransaction(id, updates) {
    // Get current transaction
    const current = await this.getTransactionById(id);

    // Validate status transition if status is being updated
    if (updates.status) {
      if (!this.isValidStatusTransition(current.status, updates.status)) {
        const error = new Error(
          `Invalid status transition from ${current.status} to ${updates.status}`
        );
        error.code = 'INVALID_TRANSITION';
        error.statusCode = 422;
        throw error;
      }
    }

    // Build update data
    const updateData = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.metadata) {
      updateData.metadata = {
        ...current.metadata,
        ...updates.metadata,
      };
    }

    // Update transaction
    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return updated;
  }

  /**
   * Soft delete transaction
   */
  async deleteTransaction(id) {
    const result = await prisma.transaction.updateMany({
      where: {
        id: parseInt(id),
        isActive: true,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    if (result.count === 0) {
      const error = new Error('Transaction not found or already deleted');
      error.code = 'NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    return { deleted: true };
  }

  /**
   * Validate status transition according to business rules
   */
  isValidStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Get transaction statistics (optional utility)
   */
  async getStatistics() {
    const [total, byStatus] = await Promise.all([
      prisma.transaction.count({ where: { isActive: true } }),
      prisma.transaction.groupBy({
        by: ['status'],
        where: { isActive: true },
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
    };
  }
}

// Export instance with all methods bound
const transactionServiceInstance = new TransactionService();

module.exports = {
  createTransaction: transactionServiceInstance.createTransaction.bind(transactionServiceInstance),
  getTransactionById: transactionServiceInstance.getTransactionById.bind(transactionServiceInstance),
  listTransactions: transactionServiceInstance.listTransactions.bind(transactionServiceInstance),
  updateTransaction: transactionServiceInstance.updateTransaction.bind(transactionServiceInstance),
  deleteTransaction: transactionServiceInstance.deleteTransaction.bind(transactionServiceInstance),
  isValidStatusTransition: transactionServiceInstance.isValidStatusTransition.bind(transactionServiceInstance),
  getStatistics: transactionServiceInstance.getStatistics.bind(transactionServiceInstance),
};