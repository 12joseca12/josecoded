#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# Libreria comun de los hooks del harness. Se carga con `. lib.sh`; no ejecuta nada por si sola.

# Raiz del proyecto: $CLAUDE_PROJECT_DIR o tres niveles por encima de este fichero
# (.claude/hooks/harness/lib.sh -> raiz).
if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  # pwd -P resuelve enlaces y quita la barra final; si el directorio no existe se deja tal cual.
  HARNESS_ROOT="$(cd "$CLAUDE_PROJECT_DIR" 2>/dev/null && pwd -P)" || HARNESS_ROOT="$CLAUDE_PROJECT_DIR"
else
  HARNESS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." 2>/dev/null && pwd -P)"
fi

HARNESS_INPUT=""

# Lee el JSON de stdin a HARNESS_INPUT.
harness_read_input() {
  HARNESS_INPUT="$(cat 2>/dev/null)" || HARNESS_INPUT=""
}

# json_get <clave> [subclave]: valor del JSON de entrada (jq -> node -> python3). Vacio si no hay.
json_get() {
  [ -n "$HARNESS_INPUT" ] || return 0
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$HARNESS_INPUT" | jq -r --arg a "$1" --arg b "${2:-}" \
      'if $b == "" then .[$a] else .[$a][$b] end | if . == null then empty else tostring end' 2>/dev/null
  elif command -v node >/dev/null 2>&1; then
    printf '%s' "$HARNESS_INPUT" | node -e '
      let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
        try {
          let v = JSON.parse(s)[process.argv[1]];
          if (process.argv[2] && v !== null && v !== undefined) v = v[process.argv[2]];
          if (v !== null && v !== undefined) process.stdout.write(typeof v === "object" ? JSON.stringify(v) : String(v));
        } catch (e) {}
      });' "$1" "${2:-}" 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$HARNESS_INPUT" | python3 -c '
import json, sys
try:
    v = json.load(sys.stdin).get(sys.argv[1])
    if sys.argv[2]:
        v = v.get(sys.argv[2]) if isinstance(v, dict) else None
    if v is not None:
        sys.stdout.write(json.dumps(v) if isinstance(v, (dict, list)) else (str(v).lower() if isinstance(v, bool) else str(v)))
except Exception:
    pass' "$1" "${2:-}" 2>/dev/null
  fi
  return 0
}

# Directorio de estado de la sesion (se crea): ${TMPDIR:-/tmp}/claude-harness/<session_id saneado | nosession>.
state_dir() {
  local sid d
  sid="$(json_get session_id)"
  sid="$(printf '%s' "$sid" | tr -c 'A-Za-z0-9_-' '_')"
  [ -n "$sid" ] || sid="nosession"
  local p="${TMPDIR:-/tmp}/claude-harness"
  d="$p/$sid"
  # El padre tambien debe ser nuestro, un directorio real (no enlace) y privado (700).
  [ -L "$p" ] && return 1
  (umask 077; mkdir -p "$d" 2>/dev/null)
  [ -d "$p" ] && [ -O "$p" ] || return 1
  chmod 700 "$p" 2>/dev/null
  # Solo se usa si es del usuario actual; si no, no se escribe nada.
  [ -d "$d" ] && [ -O "$d" ] || return 1
  printf '%s\n' "$d"
}

# norm_path <ruta>: ruta absoluta con enlaces y ".." resueltos en el directorio padre.
# Devuelve 1 si el directorio padre no existe.
norm_path() {
  local d
  case "$1" in */*) d="${1%/*}"; [ -n "$d" ] || d="/" ;; *) return 1 ;; esac
  d="$(cd "$d" 2>/dev/null && pwd -P)" || return 1
  case "$d" in /) printf '/%s\n' "${1##*/}" ;; *) printf '%s/%s\n' "$d" "${1##*/}" ;; esac
}

# bin <nombre>: ruta de node_modules/.bin/<nombre> si es ejecutable; si no, devuelve 1.
bin() {
  local p="$HARNESS_ROOT/node_modules/.bin/$1"
  [ -x "$p" ] || return 1
  printf '%s\n' "$p"
}
