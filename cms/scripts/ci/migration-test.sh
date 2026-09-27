#!/usr/bin/env bash
# Apply the pending migrations to a COPY of a database and prove what they did.
# Run from anywhere; the source database is never modified.
#
#   bash cms/scripts/ci/migration-test.sh [path/to/snapshot.db]   # default: latest prod snapshot
#   bash cms/scripts/ci/migration-test.sh --fresh-only            # no snapshot: migrate an empty DB
#
# Checks:
#   - migrations apply cleanly (to the snapshot, and to an empty DB)
#   - migrated snapshot schema == schema built from migrations alone (no hidden drift)
#   - no row of the snapshot is lost (db-diff exit 2 unless ALLOW_DATA_LOSS=1)
#   - integrity_check passes
# Leaves the migrated copy at $OUT_DB (default .verify/migrated.db) for later stages.
set -euo pipefail
CMS="$(cd "$(dirname "$0")/../.." && pwd)"
ROOT="$(cd "$CMS/.." && pwd)"
OUT_DIR="${OUT_DIR:-$ROOT/.verify}"
mkdir -p "$OUT_DIR"

migrate() { # $1 = sqlite file
  local log="$OUT_DIR/migrate.log" rc=0
  (cd "$CMS" && PAYLOAD_SECRET="${PAYLOAD_SECRET:-migration-test}" DATABASE_URI="file:$1" \
    node node_modules/payload/bin.js migrate) >"$log" 2>&1 || rc=$?
  sed "s/\x1b\[[0-9;]*m//g" "$log" | grep -E "Migrat|rror" | sed "s/^/   /" || true
  [ "$rc" = 0 ] || { echo "   FAIL: migrate exited $rc"; tail -20 "$log"; exit 1; }
}
columns() { sqlite3 "$1" "select m.name||'.'||p.name||' '||p.type from sqlite_master m, pragma_table_info(m.name) p where m.type='table' and m.name not like 'sqlite_%' order by 1;"; }
indexes() { sqlite3 "$1" "select name from sqlite_master where type='index' and name not like 'sqlite_%' order by 1;"; }

echo "-- fresh: migrate an empty database from zero"
FRESH="$OUT_DIR/fresh.db"; rm -f "$FRESH"*
migrate "$FRESH"
[ "$(sqlite3 "$FRESH" 'pragma integrity_check')" = ok ] || { echo "   FAIL: integrity"; exit 1; }
echo "   ok ($(sqlite3 "$FRESH" 'select count(*) from payload_migrations') migrations)"

[ "${1:-}" = "--fresh-only" ] && exit 0

SNAP="${1:-}"
if [ -z "$SNAP" ]; then
  [ -f "$CMS/data/snapshots/LATEST" ] || { echo "No snapshot. Run: npm run pull (repo root)"; exit 1; }
  SNAP="$ROOT/$(cat "$CMS/data/snapshots/LATEST")"
fi
echo "-- snapshot: $(basename "$SNAP") ($(date -r "$SNAP" '+%Y-%m-%d %H:%M'))"
OUT_DB="${OUT_DB:-$OUT_DIR/migrated.db}"; rm -f "$OUT_DB"*
cp "$SNAP" "$OUT_DB"; chmod 644 "$OUT_DB"
echo "   pending before: $(comm -23 <(cd "$CMS/src/migrations" && ls *.ts | grep -v index.ts | sed 's/\.ts$//' | sort) <(sqlite3 "$SNAP" 'select name from payload_migrations' | sort) | tr '\n' ' ')"
migrate "$OUT_DB"
[ "$(sqlite3 "$OUT_DB" 'pragma integrity_check')" = ok ] || { echo "   FAIL: integrity"; exit 1; }

echo "-- schema: migrated snapshot vs fresh-from-migrations"
if diff <(columns "$OUT_DB") <(columns "$FRESH") >"$OUT_DIR/schema.diff" && diff <(indexes "$OUT_DB") <(indexes "$FRESH") >>"$OUT_DIR/schema.diff"; then
  echo "   ok (identical)"
else
  echo "   FAIL: schemas differ (< snapshot, > fresh):"; sed 's/^/     /' "$OUT_DIR/schema.diff"; exit 1
fi

echo "-- data: snapshot vs migrated snapshot"
node "$CMS/scripts/ci/db-diff.mjs" "$SNAP" "$OUT_DB" 2>&1 | grep -v ExperimentalWarning
