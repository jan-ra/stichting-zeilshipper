# Shared helpers for verify.sh and rehearse-release.sh. Source, don't run.
# Expects REPO_ROOT and OUT_DIR to be set.

MINIO_MEDIA_URL="http://localhost:9000/zeilshipper-media"
PIDS=()

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
note() { printf '    %s\n' "$*"; }

# Run a named stage, time it, and record PASS/FAIL in the report.
REPORT_ROWS=()
stage() { # stage <name> <command...>
  local name="$1"; shift
  local t0=$SECONDS rc=0
  log "$name"
  "$@" || rc=$?
  local dt=$((SECONDS - t0))
  if [ "$rc" = 0 ]; then REPORT_ROWS+=("| $name | pass | ${dt}s |"); else REPORT_ROWS+=("| $name | **FAIL** (exit $rc) | ${dt}s |"); fi
  return "$rc"
}

wait_http() { # wait_http <url> <timeout-seconds>
  local url="$1" timeout="${2:-120}" t=0
  until curl -sf "$url" -o /dev/null; do
    sleep 2; t=$((t + 2))
    if [ "$t" -ge "$timeout" ]; then echo "timed out after ${timeout}s waiting for $url" >&2; return 1; fi
  done
  return 0
}

minio_up() {
  docker compose -f "$REPO_ROOT/cms/docker-compose.minio.yml" up -d >/dev/null 2>&1
  wait_http "http://localhost:9000/minio/health/live" 60
}

# Build the static site against a running CMS and serve it. Sets SITE_URL.
build_and_serve_site() { # <cms-url> <port>
  local cms="$1" port="$2"
  (cd "$REPO_ROOT/site" && \
    PAYLOAD_API_URL="$cms" PAYLOAD_PUBLIC_URL="$cms" MEDIA_BASE_URL="$MINIO_MEDIA_URL" BAKE_MAX_BYTES=2097152 \
    npm run build:full) >"$OUT_DIR/site-build.log" 2>&1 || { tail -30 "$OUT_DIR/site-build.log"; return 1; }
  grep -E 'wrote|✓ built|errors=' "$OUT_DIR/site-build.log" | tail -5 | sed 's/^/    /'
  (cd "$REPO_ROOT/site" && npx vite preview --port "$port" --strictPort) >"$OUT_DIR/site-preview.log" 2>&1 &
  PIDS+=($!)
  SITE_URL="http://localhost:$port"
  wait_http "$SITE_URL" 30
}

run_e2e() {
  rm -rf "$OUT_DIR/screenshots"; mkdir -p "$OUT_DIR/screenshots"
  (cd "$REPO_ROOT" && SITE_URL="$SITE_URL" npx playwright test 2>&1 | tee "$OUT_DIR/e2e.log" | grep -E '✘|passed|failed|flaky' | tail -40)
  return "${PIPESTATUS[0]}"
}

cleanup_pids() {
  for p in "${PIDS[@]:-}"; do [ -n "$p" ] && { kill "$p" 2>/dev/null; wait "$p" 2>/dev/null; } || true; done
  # next start / vite spawn children; make sure the ports are free again.
  for port in "$@"; do lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true; done
}

write_report() { # write_report <title> <overall-rc>
  local title="$1" rc="$2" file="$OUT_DIR/report.md"
  {
    echo "### $title — $([ "$rc" = 0 ] && echo PASSED || echo FAILED)"
    echo
    echo "Commit \`$(git -C "$REPO_ROOT" rev-parse --short HEAD)\`$(git -C "$REPO_ROOT" diff --quiet || echo ' + uncommitted changes') on \`$(git -C "$REPO_ROOT" branch --show-current)\` · $(date -u '+%Y-%m-%d %H:%M UTC')"
    [ -n "${SNAPSHOT_LABEL:-}" ] && echo "Data: $SNAPSHOT_LABEL"
    echo
    echo "| Stage | Result | Time |"
    echo "|---|---|---|"
    printf '%s\n' "${REPORT_ROWS[@]}"
    [ -f "$OUT_DIR/db-changes.txt" ] && { echo; echo "<details><summary>Data changes vs prod snapshot</summary>"; echo; echo '```'; cat "$OUT_DIR/db-changes.txt"; echo '```'; echo "</details>"; }
  } >"$file"
  echo; cat "$file"
}
