/**
 * ============================================================================
 * WEBHOOK SERVICE
 * ============================================================================
 * Handles incoming webhook events with idempotency
 */

const prisma = require('../config/database');
const transactionService = require('./transactionService');

class WebhookService {
  /**
   * Process webhook event
   * Implements idempotency to prevent duplicate processing
   */
  async processWebhook(webhookData) {
    const { eventId, transactionId, status, eventType = 'transaction.updated' } = webhookData;

    // Check if event already processed
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existing) {
      return {
        processed: false,
        message: 'Event already processed',
        event: existing,
      };
    }

    // Update transaction status
    try {
      await transactionService.updateTransaction(transactionId, { status });
    } catch (error) {
      // Log error but still record webhook event
      console.error('Failed to update transaction from webhook:', error);
    }

    // Record webhook event
    const event = await prisma.webhookEvent.create({
      data: {
        eventId,
        transactionId: parseInt(transactionId),
        eventType,
        payload: webhookData,
      },
    });

    return {
      processed: true,
      message: 'Webhook processed successfully',
      event,
    };
  }

  /**
   * Get webhook event by ID
   */
  async getWebhookEvent(eventId) {
    return prisma.webhookEvent.findUnique({
      where: { eventId },
    });
  }

  /**
   * List webhook events for a transaction
   */
  async getTransactionWebhooks(transactionId) {
    return prisma.webhookEvent.findMany({
      where: { transactionId: parseInt(transactionId) },
      orderBy: { processedAt: 'desc' },
    });
  }
}

// Export instance with bound methods
const webhookServiceInstance = new WebhookService();

module.exports = {
  processWebhook: webhookServiceInstance.processWebhook.bind(webhookServiceInstance),
  getWebhookEvent: webhookServiceInstance.getWebhookEvent.bind(webhookServiceInstance),
  getTransactionWebhooks: webhookServiceInstance.getTransactionWebhooks.bind(webhookServiceInstance),
};