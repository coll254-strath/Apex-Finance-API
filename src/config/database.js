/**
 * ============================================================================
 * DATABASE CONFIGURATION (Prisma 7.x)
 * ============================================================================
 * Singleton Prisma Client instance with connection pooling and logging
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
  errorFormat: 'pretty',
});

/**
 * Graceful shutdown handler
 * Ensures database connections close properly
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
