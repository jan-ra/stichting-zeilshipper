# syntax=docker/dockerfile:1.7

# Multi-stage build for the Payload + Next.js app deployed by `fly deploy`.
#
# The runtime image ships the FULL app (built .next + complete node_modules,
# dev deps included). That's deliberate: the container runs `payload migrate`
# at boot (see docker-entrypoint.sh), and the Payload CLI needs `tsx` to load
# the TypeScript config + migration files. A minimized `next build --standalone`
# bundle cannot run migrations, so we serve with `next start` instead.

# ── Stage 1: install full dependency tree ───────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# libc6-compat fixes Sharp's runtime error on Alpine; build tools compile it.
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: build the Next.js app ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── Stage 3: runtime image ──────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
# sqlite: the `sqlite3` CLI, used by the boot guard (adoption check) here and by
# the backup workflow's online `.backup` over SSH.
RUN apk add --no-cache libc6-compat sqlite

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# Full built app + dependencies (needed so `payload migrate` can run at boot).
# .dockerignore keeps local secrets, the local SQLite DB, and uploads out.
COPY --from=builder --chown=nextjs:nodejs /app ./
RUN chmod +x docker-entrypoint.sh

# /data is the fly.io mount point (SQLite DB + media uploads).
RUN mkdir -p /data /app/uploads \
    && chown -R nextjs:nodejs /data /app/uploads

USER nextjs
EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
