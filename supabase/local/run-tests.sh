#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
bindir="${PGBIN:-$(pg_config --bindir)}"
port="${PGPORT_LOCAL:-54329}"
work="$(mktemp -d)"
database="josecoded_test"

if [ "$(id -u)" -eq 0 ]; then
  chown postgres "$work"
  as_postgres() { runuser -u postgres -- "$@"; }
else
  as_postgres() { "$@"; }
fi

stop_cluster() {
  as_postgres "$bindir/pg_ctl" -D "$work/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$work"
}
trap stop_cluster EXIT

as_postgres "$bindir/initdb" -D "$work/data" -U postgres --auth=trust >/dev/null
as_postgres "$bindir/pg_ctl" -D "$work/data" -w -l "$work/server.log" \
  -o "-c listen_addresses= -k $work -p $port -c fsync=off -c synchronous_commit=off" start >/dev/null

client=(-h "$work" -p "$port" -U postgres -v ON_ERROR_STOP=1 -q)

psql "${client[@]}" -d postgres -c "create database $database"
psql "${client[@]}" -d "$database" -f "$root/supabase/local/shim.sql"

for migration in "$root"/supabase/migrations/*.sql; do
  echo "migration: $(basename "$migration")"
  psql "${client[@]}" -d "$database" --single-transaction -f "$migration"
done

echo "pgTAP without seed"
pg_prove -h "$work" -p "$port" -U postgres -d "$database" "$root"/supabase/tests/*.sql

if [ -f "$root/supabase/seed.sql" ]; then
  echo "seed: supabase/seed.sql"
  psql "${client[@]}" -d "$database" -f "$root/supabase/seed.sql"
  echo "pgTAP with seed"
  pg_prove -h "$work" -p "$port" -U postgres -d "$database" "$root"/supabase/tests/*.sql
fi
