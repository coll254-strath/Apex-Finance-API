
# STAGE 1: DEPENDENCIES
# ============================================================================
FROM node:18-alpine AS dependencies

# Set working directory
WORKDIR /app

# Install system dependencies required for Prisma
# - openssl: Required for Prisma Client
# - libc6-compat: Compatibility layer for Alpine Linux
RUN apk add --no-cache openssl libc6-compat

# Copy package files
# Copying package*.json separately leverages Docker layer caching
# If package.json hasn't changed, this layer is cached
COPY package*.json ./

# Install production dependencies only
# --omit=dev excludes devDependencies (nodemon, eslint, etc.)
# Note: Using npm ci without --frozen-lockfile to allow package-lock updates
RUN npm ci --only=production && npm cache clean --force

# ============================================================================
# STAGE 2: BUILDER (Prisma Generation)
# ============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl libc6-compat

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
# This creates the @prisma/client based on schema.prisma
RUN npx prisma generate

# Copy application source code
COPY src ./src

# ============================================================================
# STAGE 3: PRODUCTION RUNTIME
# ============================================================================
FROM node:18-alpine AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

# Create non-root user for security
# Running as root in containers is a security risk
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache openssl libc6-compat

# Copy production node_modules from dependencies stage
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy Prisma files and generated client
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy application code
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs package*.json ./

# Switch to non-root user
USER nodejs

# Expose port 3000
EXPOSE 3000

# Health check
# Docker will periodically check if container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/server.js"]
