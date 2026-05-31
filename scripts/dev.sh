#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Kill child processes on exit.
cleanup() {
  echo ""
  echo "==> Shutting down..."
  [ -n "${CMS_PID:-}" ] && kill "$CMS_PID" 2>/dev/null || true
  [ -n "${PREVIEW_PID:-}" ] && kill "$PREVIEW_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo "    Done."
}
trap cleanup EXIT INT TERM

echo "==> Starting MinIO..."
docker compose -f "$REPO_ROOT/cms/docker-compose.minio.yml" up -d
echo "    MinIO ready (API: http://localhost:9000  Console: http://localhost:9001)"

echo "==> Installing dependencies (if needed)..."
[ -d "$REPO_ROOT/cms/node_modules" ] || (cd "$REPO_ROOT/cms" && npm install)
[ -d "$REPO_ROOT/site/node_modules" ] || (cd "$REPO_ROOT/site" && npm install)

echo "==> Starting CMS..."
cd "$REPO_ROOT/cms"
npm run dev &
CMS_PID=$!

echo "==> Waiting for CMS to be ready..."
TIMEOUT=120
ELAPSED=0
until curl -sf http://localhost:3001/api/access -o /dev/null 2>/dev/null; do
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "ERROR: CMS did not start within ${TIMEOUT}s" >&2
    exit 1
  fi
  printf "    %ds...\r" "$ELAPSED"
done
echo "    CMS ready at http://localhost:3001/admin"

echo "==> Building site (load-from-payload → bake-media → vite build)..."
cd "$REPO_ROOT/site"
PAYLOAD_API_URL=http://localhost:3001 \
PAYLOAD_PUBLIC_URL=http://localhost:3001 \
MEDIA_BASE_URL=http://localhost:9000/zeilshipper-media \
  npm run build:full

echo "==> Serving site..."
npm run preview &
PREVIEW_PID=$!

echo ""
echo "Stack is up:"
echo "  Site    http://localhost:4173"
echo "  CMS     http://localhost:3001/admin"
echo "  MinIO   http://localhost:9001  (minioadmin / minioadmin)"
echo ""
echo "Press Ctrl-C to stop."
wait "$PREVIEW_PID"
