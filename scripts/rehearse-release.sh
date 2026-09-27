#!/usr/bin/env bash
# Dress rehearsal of a production release, entirely on this machine.
#
#   npm run rehearse                   rehearse HEAD against the latest prod snapshot
#   npm run rehearse -- --amd64        build for linux/amd64 like Fly does (slower, emulated)
#   npm run rehearse -- --no-rollback  skip the rollback leg
#
# 1. Builds the CMS Docker image from the working tree with the production Dockerfile.
# 2. Boots it on a copy of the prod snapshot through the real entrypoint — the same
#    dev-marker guard + `payload migrate` + `next start` Fly will run.
# 3. Proves what the migrations did to the data (db-diff: no row lost unless allowed).
# 4. Hammers the DB with concurrent writes from a second process (transactions + WAL).
# 5. Builds the site against the container and runs the browser smoke tests.
# 6. Rollback leg: boots the image that is LIVE ON FLY RIGHT NOW against the migrated
#    DB, proving `rollback.yml` (previous image, keep data) is safe for this release.
#
# Needs: Docker running, `flyctl` logged in (only to read the live image ref and pull
# it), MinIO media (`npm run pull`). Never writes to production.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/.verify/rehearsal"
APP=stichting-zeilshipper-cms
PORT=3201
SITE_PORT=4274
IMAGE=zeilshipper-cms:rehearsal
CTR=zeilshipper-rehearsal
PLATFORM=""
ROLLBACK=1
for a in "$@"; do
  case "$a" in
    --amd64) PLATFORM="--platform linux/amd64" ;;
    --no-rollback) ROLLBACK=0 ;;
    *) echo "unknown flag: $a" >&2; exit 64 ;;
  esac
done

source "$REPO_ROOT/scripts/lib/stack.sh"
rm -rf "$OUT_DIR"; mkdir -p "$OUT_DIR/data"; chmod 777 "$OUT_DIR/data"
FAILED=0
run() { stage "$@" || FAILED=1; }
cleanup() { docker rm -f "$CTR" >/dev/null 2>&1; cleanup_pids $SITE_PORT; }
trap cleanup EXIT

SNAP_REL="$(cat "$REPO_ROOT/cms/data/snapshots/LATEST" 2>/dev/null || true)"
[ -n "$SNAP_REL" ] || { echo "No prod snapshot. Run: npm run pull -- --snapshot-only"; exit 1; }
SNAP="$REPO_ROOT/$SNAP_REL"
SNAPSHOT_LABEL="prod snapshot \`$(basename "$SNAP")\`"

sq() { docker exec "$CTR" sqlite3 /data/payload.db "$1"; }

# Consistent copy of the container's live DB onto the host, via sqlite's backup API.
grab_db() { # grab_db <name>
  docker exec "$CTR" sqlite3 /data/payload.db ".backup /data/$1.db" && cp "$OUT_DIR/data/$1.db" "$OUT_DIR/$1.db"
}

boot() { # boot <image> <label>
  docker rm -f "$CTR" >/dev/null 2>&1
  docker run -d --name "$CTR" $PLATFORM -p $PORT:3000 -v "$OUT_DIR/data:/data" \
    -e DATABASE_URI=file:/data/payload.db \
    -e PAYLOAD_SECRET=rehearsal-only-secret \
    -e PAYLOAD_PUBLIC_URL=http://localhost:$PORT \
    -e S3_ENDPOINT=http://host.docker.internal:9000 -e S3_BUCKET=zeilshipper-media -e S3_REGION=auto \
    -e S3_ACCESS_KEY_ID=minioadmin -e S3_SECRET_ACCESS_KEY=minioadmin \
    -e MEDIA_BASE_URL="$MINIO_MEDIA_URL" \
    -e CF_PAGES_DEPLOY_HOOK= \
    "$1" >/dev/null || return 1
  if ! wait_http "http://localhost:$PORT/api/access" 240; then
    echo "    $2 did not become healthy. Container log:"; docker logs "$CTR" 2>&1 | tail -30 | sed 's/^/    /'; return 1
  fi
  docker logs "$CTR" 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E 'entrypoint|Migrat|FATAL|rror' | sed 's/^/    /'
  note "$2 healthy on :$PORT"
}

# ── 1. Image ───────────────────────────────────────────────────────────────
build_image() {
  docker build $PLATFORM -t "$IMAGE" "$REPO_ROOT/cms" >"$OUT_DIR/docker-build.log" 2>&1 \
    || { tail -30 "$OUT_DIR/docker-build.log"; return 1; }
  note "$(docker image inspect "$IMAGE" --format '{{.Architecture}} {{.Size}}' | awk '{printf "%s, %.0f MB", $1, $2/1048576}')"
}
run "Build production image" build_image

# ── 2+3. Boot on prod copy, migrate, diff ──────────────────────────────────
prepare_data() {
  cp "$SNAP" "$OUT_DIR/data/payload.db" && chmod 666 "$OUT_DIR/data/payload.db"
  minio_up
}
check_migrations() {
  local expected applied missing
  expected="$(cd "$REPO_ROOT/cms/src/migrations" && ls *.ts | grep -v index.ts | sed 's/\.ts$//' | sort)"
  applied="$(sq 'select name from payload_migrations' | sort)"
  missing="$(comm -23 <(echo "$expected") <(echo "$applied"))"
  note "applied: $(echo "$applied" | tr '\n' ' ')"
  note "journal_mode: $(sq 'pragma journal_mode')  integrity: $(sq 'pragma integrity_check')"
  [ -z "$missing" ] || { echo "    FAIL: not applied: $missing"; return 1; }
  grab_db after-migrate || return 1
  node "$REPO_ROOT/cms/scripts/ci/db-diff.mjs" "$SNAP" "$OUT_DIR/after-migrate.db" 2>&1 | grep -v ExperimentalWarning | tee "$OUT_DIR/db-changes.txt"
  return "${PIPESTATUS[0]}"
}
if [ "$FAILED" = 0 ]; then
  boot_new() { prepare_data && boot "$IMAGE" "new image"; }
  run "Boot new image on prod copy" boot_new
  [ "$FAILED" = 0 ] && run "Migrations applied, no data lost" check_migrations
fi

# ── 4. Concurrent writes ───────────────────────────────────────────────────
if [ "$FAILED" = 0 ]; then
  probe() { docker exec "$CTR" node node_modules/payload/bin.js run scripts/ci/concurrency-probe.ts "$1" 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E 'probe' | sed 's/^/    /'; return "${PIPESTATUS[0]}"; }
  run "Migration transactions roll back" probe rollback
  run "Concurrent writes (2 processes)" probe contention
fi

# ── 5. Site + browser ──────────────────────────────────────────────────────
if [ "$FAILED" = 0 ]; then
  OUT_DIR_SAVE="$OUT_DIR"; OUT_DIR="$REPO_ROOT/.verify"
  run "Site build against container" build_and_serve_site "http://localhost:$PORT" $SITE_PORT
  [ "$FAILED" = 0 ] && run "Browser smoke tests" run_e2e
  OUT_DIR="$OUT_DIR_SAVE"
fi

# ── 6. Rollback leg ────────────────────────────────────────────────────────
if [ "$FAILED" = 0 ] && [ "$ROLLBACK" = 1 ]; then
  rollback_leg() {
    local live
    live="$(flyctl machine list -a "$APP" --json | node -e 'const m=JSON.parse(require("fs").readFileSync(0));const c=m.find(x=>x.config?.image);process.stdout.write(c?c.config.image:"")')"
    [ -n "$live" ] || { echo "    could not read the live image from Fly"; return 1; }
    case "$live" in registry.fly.io/*) ;; *) live="registry.fly.io/$live" ;; esac
    note "live image: $live"
    flyctl auth docker >/dev/null 2>&1
    docker pull --platform linux/amd64 "$live" >"$OUT_DIR/pull-live.log" 2>&1 || { tail -5 "$OUT_DIR/pull-live.log"; return 1; }
    grab_db before-rollback || return 1
    docker rm -f "$CTR" >/dev/null
    local saved_platform="$PLATFORM"; PLATFORM="--platform linux/amd64"
    boot "$live" "live (rollback) image" || { PLATFORM="$saved_platform"; return 1; }
    PLATFORM="$saved_platform"
    local rc=0
    for path in "api/ships?limit=1" "api/media-items?limit=1" "api/blog-posts?limit=1" "api/globals/home-page" "api/globals/media-page"; do
      local code; code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/$path")"
      note "GET /$path -> $code"; [ "$code" = 200 ] || rc=1
    done
    grab_db after-rollback || return 1
    note "data after rollback boot vs just before it:"
    node "$REPO_ROOT/cms/scripts/ci/db-diff.mjs" "$OUT_DIR/before-rollback.db" "$OUT_DIR/after-rollback.db" 2>&1 | grep -v ExperimentalWarning | sed 's/^/  /' || rc=1
    return $rc
  }
  run "Rollback: live image on migrated DB" rollback_leg
fi

write_report "Release rehearsal" $FAILED
cp "$OUT_DIR/report.md" "$REPO_ROOT/.verify/rehearsal-report.md" 2>/dev/null
exit $FAILED
