#!/usr/bin/env bash
# The gate every change passes before a PR. Run from anywhere.
#
#   npm run verify            full: static checks, migration test on the latest prod
#                             snapshot, production CMS build, site build on that data,
#                             browser smoke tests (nl+en, desktop+mobile)
#   npm run verify -- --quick static checks only (typecheck, unit tests, migration guard)
#   npm run verify -- --ci    what GitHub Actions runs: no prod data, no browser
#
# Never touches production. Works on a copy of cms/data/snapshots/<LATEST> (refresh
# with `npm run pull -- --snapshot-only`). Output: .verify/report.md (paste into the PR),
# .verify/screenshots/, logs.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$REPO_ROOT/.verify"
CMS_PORT=3101
SITE_PORT=4273
MODE=full
for a in "$@"; do
  case "$a" in
    --quick) MODE=quick ;;
    --ci) MODE=ci ;;
    *) echo "unknown flag: $a" >&2; exit 64 ;;
  esac
done

source "$REPO_ROOT/scripts/lib/stack.sh"
# Keep the rehearsal output: it is a separate, slower run that the PR also quotes.
mkdir -p "$OUT_DIR"; find "$OUT_DIR" -mindepth 1 -maxdepth 1 ! -name "rehearsal*" -exec rm -rf {} +
trap 'cleanup_pids $CMS_PORT $SITE_PORT' EXIT
FAILED=0
run() { stage "$@" || FAILED=1; }

# ── Static ─────────────────────────────────────────────────────────────────
run "CMS typecheck"     bash -c "cd '$REPO_ROOT/cms' && PAYLOAD_SECRET=verify DATABASE_URI=file:$OUT_DIR/types.db node node_modules/payload/bin.js generate:types >/dev/null 2>&1 && npx tsc --noEmit -p . && echo '    ok'"
# The stage result is node's exit code; the grep only trims the output.
unit() { (cd "$REPO_ROOT/$1" && node --test --test-reporter=spec "$2") >"$OUT_DIR/unit-$1.log" 2>&1; local rc=$?; grep -E '^ℹ (pass|fail)|✖' "$OUT_DIR/unit-$1.log" | sed 's/^/    /'; return $rc; }
run "Unit tests (cms)"  unit cms 'tests/**/*.test.mjs'
run "Unit tests (site)" unit site 'tests/**/*.test.js'

run "Migration guard"   bash "$REPO_ROOT/cms/scripts/ci/migration-guard.sh"

if [ "$MODE" = quick ]; then write_report "verify --quick" $FAILED; exit $FAILED; fi

# ── Database ───────────────────────────────────────────────────────────────
if [ "$MODE" = ci ]; then
  run "Migrations from zero" bash "$REPO_ROOT/cms/scripts/ci/migration-test.sh" --fresh-only
else
  SNAP_REL="$(cat "$REPO_ROOT/cms/data/snapshots/LATEST" 2>/dev/null || true)"
  [ -n "$SNAP_REL" ] || { echo "No prod snapshot. Run: npm run pull -- --snapshot-only"; exit 1; }
  SNAPSHOT_LABEL="prod snapshot \`$(basename "$SNAP_REL")\`"
  mig() { bash "$REPO_ROOT/cms/scripts/ci/migration-test.sh" "$REPO_ROOT/$SNAP_REL" | tee "$OUT_DIR/migration-test.txt"; local rc=${PIPESTATUS[0]}; sed -n '/^-- data/,$p' "$OUT_DIR/migration-test.txt" | tail -n +2 >"$OUT_DIR/db-changes.txt"; return $rc; }
  run "Migrations on prod snapshot" mig
fi

# ── Build ──────────────────────────────────────────────────────────────────
# next build rewrites next-env.d.ts to point at its distDir; put it back afterwards.
run "CMS production build" bash -c "cd '$REPO_ROOT/cms' && cp next-env.d.ts '$OUT_DIR/next-env.d.ts' && trap 'cp \"$OUT_DIR/next-env.d.ts\" next-env.d.ts' EXIT && NEXT_DIST_DIR=.next-verify npx next build >'$OUT_DIR/cms-build.log' 2>&1 || { tail -40 '$OUT_DIR/cms-build.log'; exit 1; }; grep -E 'Compiled|Route' '$OUT_DIR/cms-build.log' | head -3"

if [ "$MODE" = ci ] || [ "$FAILED" != 0 ]; then
  [ "$FAILED" != 0 ] && note "skipping stack + browser stages: earlier stage failed"
  write_report "verify --$MODE" $FAILED; exit $FAILED
fi

# ── Full stack on the migrated prod copy ───────────────────────────────────
STACK_DB="$OUT_DIR/stack.db"
cp "$OUT_DIR/migrated.db" "$STACK_DB"
start_cms() {
  minio_up || return 1
  (cd "$REPO_ROOT/cms" && NEXT_DIST_DIR=.next-verify DATABASE_URI="file:$STACK_DB" \
     PAYLOAD_PUBLIC_URL="http://localhost:$CMS_PORT" CF_PAGES_DEPLOY_HOOK= \
     npx next start -p $CMS_PORT) >"$OUT_DIR/cms-server.log" 2>&1 &
  PIDS+=($!)
  wait_http "http://localhost:$CMS_PORT/api/access" 120 && note "CMS up on :$CMS_PORT"
}
run "Start CMS on migrated snapshot" start_cms
[ "$FAILED" = 0 ] && run "Site build on that data" build_and_serve_site "http://localhost:$CMS_PORT" $SITE_PORT
[ "$FAILED" = 0 ] && run "Browser smoke tests" run_e2e

write_report "verify" $FAILED
exit $FAILED
