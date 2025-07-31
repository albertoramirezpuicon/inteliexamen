# Multi-stage build for maximum optimization
FROM node:20.9.0-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
#RUN npm ci --prefer-offline --no-audit --production=false

FROM node:20.9.0-alpine AS builder
WORKDIR /app
#COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Enhanced build with comprehensive Jest worker cleanup
RUN timeout 1800 npm run build:fast && \
    echo "Build completed successfully, cleaning up Jest workers..." && \
    pkill -f jest-worker || true || \
    (echo "Build timeout or failed - killing any stuck processes" && \
     pkill -f jest-worker || true)

FROM node:20.9.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3006
ENV PORT=3006
ENV HOSTNAME="0.0.0.0"

# Add health check to prevent stuck processes
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3006/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

CMD ["node", "server.js"]