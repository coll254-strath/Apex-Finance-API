/**
 * ============================================================================
 * WEBHOOK CONTROLLER
 * ============================================================================
 * Handles incoming webhook notifications
 */

const webhookService = require('../services/webhookService');
const { HTTP_STATUS } = require('../config/constants');

class WebhookController {
  /**
   * POST /v1/webhooks/transaction-update
   * Process webhook event
   */
  async handleWebhook(req, res, next) {
    try {
      const result = await webhookService.processWebhook(req.body);

      console.log(`[WEBHOOK] Event: ${req.body.eventId}, Processed: ${result.processed}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        ...result,
      });
    } catch (error) {
      // Always respond with 200 to webhooks to prevent retries
      // Log error but acknowledge receipt
      console.error('[WEBHOOK ERROR]', error);
      
      res.status(HTTP_STATUS.OK).json({
        success: false,
        message: 'Webhook received but processing failed',
        error: error.message,
      });
    }
  }
}

module.exports = new WebhookController();