#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP=stichting-zeilshipper-cms

echo "==> Starting MinIO..."
docker compose -f "$REPO_ROOT/cms/docker-compose.minio.yml" up -d
echo "    MinIO ready."

echo "==> Pulling SQLite from Fly ($APP)..."
STAMP=$(date -u +%Y%m%d-%H%M%S)
DB_PATH="$REPO_ROOT/cms/data/payload.db"
mkdir -p "$(dirname "$DB_PATH")"

# Wake the machine if it's scaled to zero — a GET to the health endpoint triggers auto-start.
CMS_URL="https://stichting-zeilshipper-cms.fly.dev"
echo "    Waking Fly machine (may take 10–30s if it was stopped)..."
curl -sf "${CMS_URL}/api/access" -o /dev/null 2>/dev/null || true   # fire-and-forget, errors ok
WAKE_TIMEOUT=120
WAKE_ELAPSED=0
until curl -sf "${CMS_URL}/api/access" -o /dev/null 2>/dev/null; do
  sleep 3
  WAKE_ELAPSED=$((WAKE_ELAPSED + 3))
  if [ "$WAKE_ELAPSED" -ge "$WAKE_TIMEOUT" ]; then
    echo "ERROR: Fly machine did not respond within ${WAKE_TIMEOUT}s" >&2
    exit 1
  fi
  printf "    %ds elapsed...\r" "$WAKE_ELAPSED"
done
echo "    Fly machine is up."

# Keep a local backup of whatever is there now.
if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "${DB_PATH}.bak"
  echo "    Backed up existing DB to payload.db.bak"
fi

# Copy the DB on the machine. SQLite's WAL mode makes a plain cp safe for a point-in-time snapshot.
flyctl ssh console -a "$APP" -C "cp /data/payload.db /data/_pull-${STAMP}.db"
rm -f "$DB_PATH"   # sftp get refuses to overwrite; .bak was already made above
flyctl ssh sftp get -a "$APP" "/data/_pull-${STAMP}.db" "$DB_PATH"
flyctl ssh console -a "$APP" -C "rm /data/_pull-${STAMP}.db"
echo "    SQLite pulled to cms/data/payload.db"

echo "==> Syncing media from R2 to MinIO..."
cd "$REPO_ROOT/cms"
node --env-file="$REPO_ROOT/.env.pull" scripts/sync-media.mjs

echo ""
echo "Done. Run 'npm run dev' to start the local stack."
