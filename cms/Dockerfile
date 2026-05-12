# syntax=docker/dockerfile:1.7

# Multi-stage build for the Payload + Next.js standalone output. Designed to
# be built and deployed by `fly deploy` directly from this directory; there is
# no docker-compose involved.

# ── Stage 1: install full dependency tree ───────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# libc6-compat fixes Sharp's runtime error on Alpine.
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: build the standalone Next.js bundle ────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: minimal runtime image ──────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# Standalone output bundles the minimum runtime + production dependencies.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# /data is the fly.io mount point (SQLite DB + media uploads).
RUN mkdir -p /data /app/uploads \
    && chown -R nextjs:nodejs /data /app/uploads

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
