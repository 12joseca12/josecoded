#!/usr/bin/env bash
# Read-only dump of the production schema into supabase/schema/baseline.sql (no data),
# then regenerates baseline.meta.json from the dump. Requires `supabase login` and
# `supabase link --project-ref nrgrmymsjtgayzejtawa` (only reads the schema; never writes to prod).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

if ! command -v supabase >/dev/null 2>&1; then
  echo "error: supabase CLI not found in PATH" >&2
  exit 1
fi

if [ ! -f supabase/.temp/project-ref ]; then
  echo "error: project not linked. Run: supabase login && supabase link --project-ref nrgrmymsjtgayzejtawa" >&2
  exit 1
fi

echo "Dumping schema of linked project $(cat supabase/.temp/project-ref) (read-only, no data)..."
supabase db dump --linked --schema public,private,storage,vault -f supabase/schema/baseline.sql

node supabase/scripts/baseline-meta.ts supabase/schema/baseline.sql supabase/schema/baseline.meta.json
