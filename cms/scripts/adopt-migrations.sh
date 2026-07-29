#!/usr/bin/env bash
#
# One-time migration adoption for a database whose schema was originally built
# by Payload's dev `push` (not by migrations). Run ONCE per environment.
#
# It does two surgical things to the `payload_migrations` bookkeeping table
# (and NOTHING to your content):
#   1. Removes the `dev`/batch=-1 push marker  → stops `payload migrate` from
#      prompting "you've run in dev mode, data loss will occur" (which would
#      hang a non-interactive CI / container boot).
#   2. Records the baseline migration as already-applied → so `payload migrate`
#      treats the existing schema as the baseline and only runs FUTURE deltas.
#
# Idempotent: safe to re-run — it no-ops if the baseline is already recorded.
#
# Usage:
#   # Local (default target = cms/data/payload.db):
#   bash scripts/adopt-migrations.sh
#
#   # Any explicit sqlite file:
#   bash scripts/adopt-migrations.sh /path/to/payload.db
#
#   # Production (run FROM the Fly machine, AFTER taking a fresh backup):
#   flyctl ssh console -a stichting-zeilshipper-cms \
#     -C "sqlite3 /data/payload.db \"DELETE FROM payload_migrations WHERE name='dev' AND batch=-1; INSERT INTO payload_migrations (name,batch) SELECT '20260717_205802_initial',1 WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name='20260717_205802_initial');\""
#
set -euo pipefail

# The initial full-schema migration this repo baselines against.
BASELINE="20260717_205802_initial"

DB="${1:-$(cd "$(dirname "$0")/.." && pwd)/data/payload.db}"

if [ ! -f "$DB" ]; then
  echo "ERROR: database not found: $DB" >&2
  exit 1
fi
if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "ERROR: sqlite3 CLI not found on PATH" >&2
  exit 1
fi

echo "==> Adopting migrations on: $DB"

# The payload_migrations table must exist (it does on any DB Payload has booted).
if [ "$(sqlite3 "$DB" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='payload_migrations';")" != "1" ]; then
  echo "ERROR: payload_migrations table missing — is this a Payload database?" >&2
  exit 1
fi

echo "    Rows before:"
sqlite3 "$DB" "SELECT '      '||id||'  '||name||'  batch='||batch FROM payload_migrations;"

sqlite3 "$DB" <<SQL
DELETE FROM payload_migrations WHERE name='dev' AND batch=-1;
INSERT INTO payload_migrations (name, batch)
SELECT '${BASELINE}', 1
WHERE NOT EXISTS (SELECT 1 FROM payload_migrations WHERE name='${BASELINE}');
SQL

echo "    Rows after:"
sqlite3 "$DB" "SELECT '      '||id||'  '||name||'  batch='||batch FROM payload_migrations;"
echo "==> Done. 'payload migrate' will now no-op on the baseline and apply only future deltas."
