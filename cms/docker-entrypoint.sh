#!/bin/sh
# Container entrypoint for the Payload CMS on Fly.io.
#
# Runs any PENDING database migrations against the mounted SQLite volume, then
# starts the Next.js server. Env (DATABASE_URI, PAYLOAD_SECRET, …) comes from
# Fly secrets — no .env file in prod, so we invoke the Payload CLI directly and
# let it read process.env.
#
# Why migrate here (and not a Fly release_command)? Fly release VMs do not mount
# app volumes, so they cannot reach /data/payload.db. The app machine DOES mount
# the volume, so migrations run at boot. When nothing is pending this is a fast
# no-op; on a deploy that ships a new migration it applies only the new delta.
#
# Safety: the DB must already have been "adopted" (see scripts/adopt-migrations.sh)
# so no interactive "dev push detected" prompt can appear. If a migration fails,
# the process exits non-zero, the health check never passes, and Fly keeps the
# previous release.
set -e

# Fail-fast guard: refuse to start on a DB that still carries Payload's dev-push
# marker (`dev`/-1). On such a DB, `payload migrate` shows an interactive
# "data loss will occur" prompt which, with no TTY, defaults to "no" and SILENTLY
# skips migrations — the server would then come up on a possibly-stale schema and
# the deploy would look healthy. Refuse instead; run scripts/adopt-migrations.sh.
DB_FILE=$(printf '%s' "${DATABASE_URI:-file:./data/payload.db}" | sed -e 's/^file://' -e 's/?.*$//')
if [ -f "$DB_FILE" ]; then
  DEV_MARKER=$(sqlite3 "$DB_FILE" "SELECT count(*) FROM payload_migrations WHERE name='dev' AND batch=-1;" 2>/dev/null || echo 0)
  if [ "$DEV_MARKER" != "0" ]; then
    echo "[entrypoint] FATAL: '$DB_FILE' still has the dev-push marker (dev/-1)." >&2
    echo "[entrypoint] Migrations would be silently skipped. Run adoption first —" >&2
    echo "[entrypoint] see 'One-time production adoption' in infra/DEVOPS-PLAN.md." >&2
    exit 1
  fi
fi

echo "[entrypoint] Applying database migrations (if any)..."
node node_modules/payload/bin.js migrate

echo "[entrypoint] Starting Next.js on port ${PORT:-3000}..."
exec node_modules/.bin/next start -p "${PORT:-3000}"
