#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# Stop: verifica lo que la sesión ha tocado. Fallos 1 y 2 del turno bloquean (exit 2); el 3.º avisa y deja parar.
# Un fallo interno del hook nunca bloquea: solo el exit 2 deliberado. Los avisos salen como systemMessage con exit 0.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P)" || exit 0
. "$here/lib.sh" || exit 0
# Sin parser JSON no se puede conocer la sesion ni stop_hook_active: no se hace nada.
command -v jq >/dev/null 2>&1 || command -v node >/dev/null 2>&1 || command -v python3 >/dev/null 2>&1 || exit 0
harness_read_input
[ -n "$(json_get session_id)" ] || exit 0
d="$(state_dir)" || exit 0
n="$d/stop-attempts"; t="$d/touched"
active="$(json_get stop_hook_active)"
[ "$active" = "true" ] || { printf '%s' "$HARNESS_INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true' && active=true; }
[ "$active" = "true" ] || rm -f "$n"
cd "$HARNESS_ROOT" 2>/dev/null || exit 0

# json_msg <texto>: {"systemMessage": ...} con el texto escapado (una sola linea).
json_msg() {
  local s; s="$(printf '%s' "$1" | tr '\n\t' '  ' | tr -d '\000-\037' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
  printf '{"systemMessage":"%s"}\n' "$s"
}

# Red: sin ficheros apuntados (ediciones por Bash o por subagente) solo se AVISA de los ficheros de git
# modificados despues del marcador de sesion (`verified` del ultimo Stop, o `started` de SessionStart).
# Nunca bloquea ni los verifica: pueden ser trabajo ajeno de Jose.
if [ ! -s "$t" ]; then
  ref="$d/verified"; [ -e "$ref" ] || ref="$d/started"
  [ -e "$ref" ] || exit 0
  net="$(git -c core.quotePath=false diff --name-only --relative --diff-filter=ACMR HEAD -- 2>/dev/null ||
    git -c core.quotePath=false diff --name-only --relative --diff-filter=ACMR -- 2>/dev/null)"
  list=""; cnt=0
  while IFS= read -r f; do
    [ -n "$f" ] && [ -f "$HARNESS_ROOT/$f" ] && [ "$HARNESS_ROOT/$f" -nt "$ref" ] || continue
    cnt=$((cnt+1)); [ "$cnt" -le 5 ] && list="${list:+$list, }$f"
  done <<EOT
$net
EOT
  [ "$cnt" -gt 0 ] || exit 0
  [ "$cnt" -le 5 ] || list="$list, ... ($cnt en total)"
  : > "$ref" 2>/dev/null
  json_msg "harness: hay ficheros modificados fuera de las ediciones de Claude: $list"
  exit 0
fi

LC_ALL=C sort -u "$t" > "$t.u" 2>/dev/null || exit 0
out="$("$here/verify.sh" --files-from "$t.u" 2>&1)"; rc=$?
warns="$(printf '%s\n' "$out" | sed -n 's/^!! //p' | head -n 3)"
blocks="$(printf '%s\n' "$out" | grep -v '^!! ')"
# 0 = verde (con o sin avisos); 1 = fallo real de verificacion; otro codigo = fallo del propio hook, no bloquea.
if [ "$rc" -eq 0 ]; then
  rm -f "$t" "$t.u" "$n"; : > "$d/verified" 2>/dev/null
  [ -z "$warns" ] || json_msg "$warns"
  exit 0
fi
[ "$rc" -eq 1 ] || exit 0
c="$(cat "$n" 2>/dev/null)"; case "$c" in ''|*[!0-9]*) c=0 ;; esac
a=$((c + 1)); echo "$a" > "$n" 2>/dev/null || exit 0
if [ "$a" -ge 3 ]; then
  rm -f "$n"
  names="$(printf '%s\n' "$blocks" | sed -n 's/^--- \([a-z:]*\) ---$/\1/p' | tr '\n' ' ')"
  json_msg "harness: 3 intentos sin dejar la verificacion en verde (${names% }). Se deja parar; queda pendiente."
  exit 0
fi
total="$(printf '%s\n' "$blocks" | wc -l | tr -d ' ')"
printf 'harness: verificación fallida (intento %s de 3). Arréglalo antes de terminar:\n' "$a" >&2
printf '%s\n' "$blocks" | head -n 28 >&2
[ "$total" -le 28 ] || printf '... (salida recortada; %s líneas más)\n' "$((total - 28))" >&2
[ -z "$warns" ] || printf '%s\n' "$warns" >&2
exit 2
