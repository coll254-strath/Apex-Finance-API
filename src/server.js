/**
 * ============================================================================
 * APEXFIN-LEDGER API SERVER
 * ============================================================================
 * Main application entry point
 * Configures Express app and starts HTTP server
 * 
 * Architecture: Layered MVC Pattern
 * - Routes → Controllers → Services → Database
 * 
 * @version 1.0.0
 * @author ApexFin Engineering Team
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { RATE_LIMIT } = require('./config/constants');

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet: Sets secure HTTP headers
app.use(helmet());

// Rate Limiting: Prevent abuse
const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// PARSING MIDDLEWARE
// ============================================================================

// Parse JSON request bodies (max 10MB)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: 'disconnected',
    });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

// Apply rate limiting to API routes
app.use('/v1', limiter);

// Mount API routes
app.use('/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ApexFin-Ledger API',
    version: '1.0.0',
    status: 'operational',
    documentation: '/v1/docs',
    endpoints: {
      health: 'GET /health',
      transactions: {
        create: 'POST /v1/transactions',
        list: 'GET /v1/transactions',
        get: 'GET /v1/transactions/:id',
        update: 'PATCH /v1/transactions/:id',
        delete: 'DELETE /v1/transactions/:id',
      },
      webhooks: {
        transactionUpdate: 'POST /v1/webhooks/transaction-update',
      },
    },
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🚀 ApexFin-Ledger API');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🗄️  Database: Neon PostgreSQL (Connected)`);
      console.log(`🔒 Security: Helmet + Rate Limiting (${RATE_LIMIT.MAX_REQUESTS} req/${RATE_LIMIT.WINDOW_MS}ms)`);
      console.log('');
      console.log('📚 Available Endpoints:');
      console.log(`   GET    http://localhost:${PORT}/health`);
      console.log(`   POST   http://localhost:${PORT}/v1/transactions`);
      console.log(`   GET    http://localhost:${PORT}/v1/transactions`);
      console.log(`   GET    http://localhost:${PORT}/v1/transactions/:id`);
      console.log(`   PATCH  http://localhost:${PORT}/v1/transactions/:id`);
      console.log(`   DELETE http://localhost:${PORT}/v1/transactions/:id`);
      console.log(`   POST   http://localhost:${PORT}/v1/webhooks/transaction-update`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Disconnect from database
    await prisma.$disconnect();
    console.log('✅ Database disconnected');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// ============================================================================
// START APPLICATION
// ============================================================================

startServer();

// Export app for testing
module.exports = app;