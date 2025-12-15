/**
 * ============================================================================
 * ROUTES INDEX
 * ============================================================================
 * Aggregates and mounts all route modules
 */

const express = require('express');
const router = express.Router();

const transactionRoutes = require('./transactionRoutes');
const webhookRoutes = require('./webhookRoutes');

// Mount route modules
router.use('/transactions', transactionRoutes);
router.use('/webhooks', webhookRoutes);

module.exports = router;