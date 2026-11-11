#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# SessionStart: avisa en una línea si la versión del harness o el stack no cuadran. No cambia nada del proyecto.
# Además marca el inicio de la sesión ($state_dir/started) para la red de git diff de stop-verify.sh.
# Nunca falla: siempre exit 0.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P)" || exit 0
. "$here/lib.sh" 2>/dev/null || exit 0
[ -t 0 ] || harness_read_input

parser=0
command -v jq >/dev/null 2>&1 || command -v node >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 || parser=-1
[ "$parser" = 0 ] && parser=1 || parser=0

# Marcador de inicio de sesión (solo con parser: sin él no se conoce la sesión).
# startup/resume/clear: sesión nueva, se renueva started y se borra verified. compact: no se toca nada.
if [ "$parser" = 1 ] && [ -n "$(json_get session_id)" ]; then
  d="$(state_dir)" && {
    if [ "$(json_get source)" != "compact" ]; then
      rm -f "$d/verified" 2>/dev/null; : > "$d/started" 2>/dev/null
    elif [ ! -e "$d/started" ]; then
      : > "$d/started" 2>/dev/null
    fi
  }
fi

root="$HARNESS_ROOT"
m="$root/.claude/harness.json"
[ -f "$m" ] || exit 0

# mval <clave>: valor de texto del manifiesto. Con parser, via json_get; si no, sed tolerante (una línea, tabuladores).
manifest="$(cat "$m" 2>/dev/null)"
mval() {
  local v=""
  if [ "$parser" = 1 ]; then
    local saved="$HARNESS_INPUT"; HARNESS_INPUT="$manifest"; v="$(json_get "$1")"; HARNESS_INPUT="$saved"
  fi
  if [ -z "$v" ]; then
    v="$(printf '%s' "$manifest" | tr -d '\n\r' | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p" | head -1)"
  fi
  printf '%s' "$v"
}
norm() { printf '%s' "$1" | tr -s ' \t' '\n\n' | LC_ALL=C sort -u | tr '\n' ' ' | sed 's/ *$//'; }

ver="$(mval version)"; stack="$(mval stack)"
# Ilegible: falta version o no existe la clave stack ("stack": "" es válido: proyecto sin stack detectable).
if [ -z "$ver" ] || ! printf '%s' "$manifest" | grep -q '"stack"[[:space:]]*:'; then
  echo "harness: .claude/harness.json ilegible. Ejecuta /harness."
  exit 0
fi
home="${HARNESS_HOME:-$HOME/Documents/GitHub/claude-config}"
if [ -f "$home/templates/harness/VERSION" ]; then
  tv="$(tr -d '[:space:]' < "$home/templates/harness/VERSION" 2>/dev/null)"
  [ "$tv" = "$ver" ] || echo "harness: el proyecto está en $ver y las plantillas en $tv. Ejecuta /harness update."
fi
now="$("$here/detect-stack.sh" "$root" 2>/dev/null)"
[ "$(norm "$now")" = "$(norm "$stack")" ] || echo "harness: stack detectado ($(norm "$now")) distinto del aplicado ($(norm "$stack")). Ejecuta /harness."
exit 0
