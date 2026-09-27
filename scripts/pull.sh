#!/usr/bin/env bash
# Bring production down to this machine: DB snapshot + media + live positions.
# Read-only against production (the only write is a temp file on the volume, removed after).
#
#   npm run pull                 snapshot + replace local DB (old one kept as .bak-<stamp>)
#   npm run pull -- --snapshot-only   snapshot only; leave cms/data/payload.db alone
#   npm run pull -- --no-media   skip the R2 → MinIO mirror
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP=stichting-zeilshipper-cms
CMS_URL="https://${APP}.fly.dev"
SNAP_DIR="$REPO_ROOT/cms/data/snapshots"
DB_PATH="$REPO_ROOT/cms/data/payload.db"
KEEP_SNAPSHOTS=10

SNAPSHOT_ONLY=0; MEDIA=1
for a in "$@"; do
  case "$a" in
    --snapshot-only) SNAPSHOT_ONLY=1 ;;
    --no-media) MEDIA=0 ;;
    *) echo "unknown flag: $a" >&2; exit 64 ;;
  esac
done

echo "==> Waking Fly machine ($APP)..."
for i in $(seq 1 40); do
  curl -sf "${CMS_URL}/api/access" -o /dev/null && break
  [ "$i" = 40 ] && { echo "ERROR: Fly machine did not respond within 120s" >&2; exit 1; }
  sleep 3
done

STAMP=$(date -u +%Y%m%d-%H%M%S)
REMOTE="/data/_pull-${STAMP}.db"
SNAP="$SNAP_DIR/prod-${STAMP}.db"
mkdir -p "$SNAP_DIR"

echo "==> Snapshotting prod DB (sqlite online backup — consistent even mid-save)..."
flyctl ssh console -a "$APP" -C "sqlite3 /data/payload.db \".backup ${REMOTE}\"" >/dev/null
trap 'flyctl ssh console -a "$APP" -C "rm -f ${REMOTE}" >/dev/null 2>&1 || true' EXIT
flyctl ssh sftp get -a "$APP" "$REMOTE" "$SNAP" >/dev/null
flyctl ssh console -a "$APP" -C "rm -f ${REMOTE}" >/dev/null
trap - EXIT

[ "$(sqlite3 "$SNAP" 'pragma integrity_check')" = ok ] || { echo "ERROR: snapshot failed integrity_check" >&2; exit 1; }
chmod 444 "$SNAP"
echo "cms/data/snapshots/prod-${STAMP}.db" > "$SNAP_DIR/LATEST"
echo "    $SNAP"
echo "    migrations: $(sqlite3 "$SNAP" "select group_concat(name, ', ') from payload_migrations")"

# Keep the newest N snapshots.
ls -1t "$SNAP_DIR"/prod-*.db 2>/dev/null | tail -n +$((KEEP_SNAPSHOTS + 1)) | while read -r old; do rm -f "$old"; done

if [ "$SNAPSHOT_ONLY" = 0 ]; then
  if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "${DB_PATH}.bak-${STAMP}"
    echo "    previous local DB kept as payload.db.bak-${STAMP}"
  fi
  rm -f "$DB_PATH" "$DB_PATH-wal" "$DB_PATH-shm"
  cp "$SNAP" "$DB_PATH"; chmod 644 "$DB_PATH"
  echo "    local DB replaced with the snapshot"
fi

if [ "$MEDIA" = 1 ]; then
  echo "==> Mirroring media + positions from R2 into local MinIO..."
  docker compose -f "$REPO_ROOT/cms/docker-compose.minio.yml" up -d >/dev/null
  cd "$REPO_ROOT/cms"
  node --env-file="$REPO_ROOT/.env.pull" scripts/sync-media.mjs
  node --env-file="$REPO_ROOT/.env.pull" scripts/pull-positions.mjs
fi

echo ""
echo "Done. Local now mirrors prod as of ${STAMP} UTC."
