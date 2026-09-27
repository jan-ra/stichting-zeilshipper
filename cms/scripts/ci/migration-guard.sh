#!/usr/bin/env bash
# Schema safety checks that need no production data. Run from cms/.
#
#   1. Drift     — the collection/global config must be fully described by the
#                  committed migrations. A field added without `npm run migrate:create`
#                  would otherwise ship code whose columns never reach prod.
#   2. Registry  — every migration file is listed in src/migrations/index.ts.
#   3. Destructive — migrations new on this branch (vs $BASE_REF, default origin/main)
#                  must not drop tables/columns, rebuild tables, or delete documents,
#                  unless ALLOW_DESTRUCTIVE_MIGRATION=1. Rollback to the previous
#                  release is only free while every migration is additive.
set -euo pipefail
cd "$(dirname "$0")/../.."

BASE_REF="${BASE_REF:-origin/main}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
fail=0

echo "-- drift: config vs committed migrations"
before="$(ls src/migrations)"
cp src/migrations/index.ts "$TMP/index.ts"
PAYLOAD_SECRET="${PAYLOAD_SECRET:-drift-check}" DATABASE_URI="file:$TMP/drift.db" \
  node node_modules/payload/bin.js migrate:create drift_check --skip-empty >"$TMP/drift.log" 2>&1 || { cat "$TMP/drift.log"; exit 1; }
new_files="$(comm -13 <(echo "$before") <(ls src/migrations))"
if [ -n "$new_files" ]; then
  echo "   FAIL: schema changed without a migration. Pending statements:"
  for f in $new_files; do case "$f" in *.ts) grep -E 'sql`' "src/migrations/$f" | sed 's/^/     /' | head -20;; esac; done
  echo "   Fix: cd cms && npm run migrate:create <name>, review the SQL, commit it."
  for f in $new_files; do rm -f "src/migrations/$f"; done
  cp "$TMP/index.ts" src/migrations/index.ts
  fail=1
else
  echo "   ok"
fi

echo "-- registry: every migration is in index.ts"
reg_ok=1
for f in src/migrations/*.ts; do
  n="$(basename "$f" .ts)"
  [ "$n" = index ] && continue
  if ! grep -q "name: '$n'" src/migrations/index.ts; then echo "   FAIL: $n missing from index.ts"; fail=1; reg_ok=0; fi
done
[ "$reg_ok" = 1 ] && echo "   ok"

echo "-- destructive: migrations new vs $BASE_REF"
if git rev-parse --verify -q "$BASE_REF" >/dev/null; then
  added="$(git diff --name-only --diff-filter=AM "$BASE_REF" -- src/migrations | grep -E '\.ts$' | grep -v index.ts || true)"
  hits=""
  for f in $added; do
    [ -f "../$f" ] || [ -f "$f" ] || continue
    p="$f"; [ -f "$p" ] || p="../$f"
    h="$(grep -nE 'DROP TABLE|DROP COLUMN|__new_|payload\.delete|deleteMany|DELETE FROM' "$p" | grep -v '^\s*//' || true)"
    # The down() half of a migration is expected to drop what up() added.
    if [ -n "$h" ]; then
      down_line="$(grep -n 'export async function down' "$p" | cut -d: -f1)"
      h="$(echo "$h" | awk -F: -v d="${down_line:-999999}" '$1 < d')"
    fi
    [ -n "$h" ] && hits+="$p"$'\n'"$(echo "$h" | sed 's/^/     /')"$'\n'
  done
  if [ -n "$hits" ]; then
    if [ "${ALLOW_DESTRUCTIVE_MIGRATION:-}" = 1 ]; then
      echo "   ALLOWED (ALLOW_DESTRUCTIVE_MIGRATION=1):"; printf '%s' "$hits"
    else
      echo "   FAIL: destructive statements in up():"; printf '%s' "$hits"
      echo "   Split into expand (additive, ship first) and contract (drop, a later release),"
      echo "   or set ALLOW_DESTRUCTIVE_MIGRATION=1 and say why in the PR."
      fail=1
    fi
  else
    echo "   ok (${added:-no new migrations})" | tr '\n' ' '; echo
  fi
else
  echo "   skipped: $BASE_REF not found"
fi

exit $fail
