#!/usr/bin/env bash
# Validates supabase/migrations + supabase/seed/seed.sql on a throwaway vanilla Postgres, then runs the SQL assertion
# files supabase/test/pg/*.test.sql. For sessions without Supabase local (cloud containers whose Docker cannot pull
# the images). Supabase local stays the reference: `supabase start && supabase db reset` + the TS tests.
#
#   bash supabase/test/pg/run.sh
#
# The server listens on 127.0.0.1 only (TCP, trust auth: a Unix socket path under a deep temp dir can exceed 107 bytes).
# Env: PGBIN (Postgres binaries; default `pg_config --bindir`, then /usr/lib/postgresql/16/bin), PG_TEST_TMP (parent of
# the throwaway cluster; default $TMPDIR or /tmp), PG_TEST_PORT (default 54399), PG_OS_USER (OS user that runs the
# server when this script runs as root, because initdb refuses root; default postgres; it must be able to traverse
# PG_TEST_TMP). Production is Postgres 17 and this usually runs on 16: keep migrations free of 17-only syntax.
# Each assertion raises `PASS <what>` as a notice or an exception on failure. Exit code 0 only when everything passed.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
supa="$(cd "$here/../.." && pwd)"

if [[ -z "${PGBIN:-}" ]]; then
  if command -v pg_config >/dev/null 2>&1 && [[ -x "$(pg_config --bindir)/initdb" ]]; then
    PGBIN="$(pg_config --bindir)"
  else
    PGBIN=/usr/lib/postgresql/16/bin
  fi
fi
[[ -x "$PGBIN/initdb" ]] || { echo "error: initdb not found in $PGBIN (set PGBIN)" >&2; exit 2; }
psql_bin="$PGBIN/psql"
[[ -x "$psql_bin" ]] || psql_bin="$(command -v psql)"

port="${PG_TEST_PORT:-54399}"
work="$(mktemp -d "${PG_TEST_TMP:-${TMPDIR:-/tmp}}/josecoded-pg.XXXXXX")"
data="$work/data"

as_pg=()
if [[ "$(id -u)" == 0 ]]; then
  os_user="${PG_OS_USER:-postgres}"
  chown -R "$os_user" "$work"
  as_pg=(runuser -u "$os_user" --)
fi

cleanup() {
  local code=$?
  if [[ $code -ne 0 && -s "$work/server.log" ]]; then
    echo "--- server.log (tail)" >&2
    tail -n 20 "$work/server.log" >&2
  fi
  ${as_pg[@]+"${as_pg[@]}"} "$PGBIN/pg_ctl" -D "$data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap cleanup EXIT

${as_pg[@]+"${as_pg[@]}"} "$PGBIN/initdb" -D "$data" -U postgres --auth=trust -E UTF8 --no-locale >/dev/null
${as_pg[@]+"${as_pg[@]}"} "$PGBIN/pg_ctl" -D "$data" -l "$work/server.log" -w \
  -o "-p $port -c listen_addresses=127.0.0.1 -c unix_socket_directories='' -c fsync=off" start >/dev/null

run_sql() {
  "$psql_bin" -X -q -h 127.0.0.1 -p "$port" -U postgres -d postgres -v ON_ERROR_STOP=1 -f "$1"
}

step() { printf '== %s\n' "$1"; }

step "shim"
run_sql "$here/supabase-shim.sql"

shopt -s nullglob
migrations=("$supa"/migrations/*.sql)
[[ ${#migrations[@]} -gt 0 ]] || { echo "error: no migrations in $supa/migrations" >&2; exit 1; }
for f in "${migrations[@]}"; do
  step "migration $(basename "$f")"
  run_sql "$f"
done

step "seed"
run_sql "$supa/seed/seed.sql"

total=0
for t in "$here"/*.test.sql; do
  step "test $(basename "$t")"
  log="$work/$(basename "$t").log"
  if ! run_sql "$t" >"$log" 2>&1; then
    cat "$log" >&2
    echo "FAIL: $(basename "$t")" >&2
    exit 1
  fi
  n="$(grep -c 'NOTICE:  PASS' "$log" || true)"
  grep -o 'PASS .*' "$log" | sed 's/^/   /'
  echo "   $n assertions passed"
  total=$((total + n))
done

echo "OK: ${#migrations[@]} migration(s) + seed applied; $total assertions passed"
