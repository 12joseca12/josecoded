#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# Uso: detect-stack.sh [dir]        -> etiquetas ordenadas separadas por espacio
#      detect-stack.sh --pm [dir]   -> pnpm | yarn | bun | npm | (vacio)
# Sin jq ni node: solo grep sobre package.json.
want_pm=0
if [ "${1:-}" = "--pm" ]; then want_pm=1; shift; fi
dir="${1:-${CLAUDE_PROJECT_DIR:-$PWD}}"
pkg="$dir/package.json"
app="$dir/app.json"

# Solo cuentan los bloques dependencies, devDependencies, peerDependencies y
# optionalDependencies del primer nivel (no scripts, overrides ni resolutions).
deps_text() {
  [ -f "$pkg" ] || return 0
  awk 'BEGIN { RS = "\001" }
  {
    n = length($0); depth = 0; cap = 0; key = ""; ins = 0
    for (i = 1; i <= n; i++) {
      c = substr($0, i, 1)
      if (ins) {
        if (c == "\\") { if (cap) printf "%s", c; i++; if (cap) printf "%s", substr($0, i, 1); continue }
        if (c == "\"") { ins = 0; if (depth == 1) key = cur; if (cap) printf "%s", c; continue }
        cur = cur c; if (cap) printf "%s", c; continue
      }
      if (c == "\"") { ins = 1; cur = ""; if (cap) printf "%s", c; continue }
      if (c == "{" || c == "[") {
        if (c == "{" && depth == 1 && (key == "dependencies" || key == "devDependencies" || key == "peerDependencies" || key == "optionalDependencies")) { cap = 1; capd = depth + 1 }
        depth++; if (cap) printf "%s", c; continue
      }
      if (c == "}" || c == "]") {
        depth--; if (cap && depth < capd) { cap = 0; printf "\n" } else if (cap) printf "%s", c
        continue
      }
      if (cap) printf "%s", c
    }
  }' "$pkg"
}
DEPS="$(deps_text)"
dep() { # dep X: "X": "..." dentro de los bloques de dependencias
  printf '%s' "$DEPS" | grep -Eq "\"$1\"[[:space:]]*:[[:space:]]*\""
}
pmfield() { [ -f "$pkg" ] && grep -Eq "\"packageManager\"[[:space:]]*:[[:space:]]*\"$1@" "$pkg"; }
appkey() { [ -f "$app" ] && grep -Eq "\"$1\"[[:space:]]*:" "$app"; }
has() { [ -e "$dir/$1" ]; }

if [ "$want_pm" = 1 ]; then
  if has pnpm-lock.yaml || pmfield pnpm; then echo pnpm
  elif has yarn.lock || pmfield yarn; then echo yarn
  elif has bun.lock || has bun.lockb || pmfield bun; then echo bun
  elif [ -f "$pkg" ]; then echo npm
  fi
  exit 0
fi

tags=""
add() { tags="$tags$1
"; }

[ -f "$pkg" ] && add node
has tsconfig.json && add typescript
dep next && add next
{ dep expo || appkey expo; } && add expo
dep react-native && add react-native
{ dep next || dep react-dom || appkey web; } && add web
{ [ -d "$dir/supabase" ] || dep '@supabase/supabase-js'; } && add supabase
{ has wrangler.toml || has wrangler.json || has wrangler.jsonc || dep wrangler || dep '@opennextjs/cloudflare'; } && add cloudflare
dep tailwindcss && add tailwind
{ dep '@anthropic-ai/sdk' || dep openai || dep ai || dep groq-sdk; } && add ia
has platformio.ini && add platformio
{ has Dockerfile || has docker-compose.yml || has compose.yml || has compose.yaml; } && add docker

printf '%s' "$tags" | LC_ALL=C sort | tr '\n' ' ' | sed 's/ $//'
echo
exit 0
