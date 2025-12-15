/**
 * ============================================================================
 * WEBHOOK ROUTES
 * ============================================================================
 * Webhook endpoints for async event processing
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { webhookValidation } = require('../middleware/validators');

/**
 * POST /v1/webhooks/transaction-update
 * Receive transaction status updates
 */
router.post(
  '/transaction-update',
  webhookValidation,
  webhookController.handleWebhook
);

module.exports = router;