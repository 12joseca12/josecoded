#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# PostToolUse: apunta el fichero tocado y lo formatea con prettier si el proyecto lo tiene.
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
harness_read_input
f="$(json_get tool_input file_path)"
[ -n "$f" ] || f="$(json_get tool_input notebook_path)"
[ -n "$f" ] && [ -f "$f" ] || exit 0
# Un enlace simbolico puede apuntar fuera del proyecto: ni se formatea ni se apunta.
[ -L "$f" ] && exit 0
f="$(norm_path "$f")" || exit 0
case "$f" in "$HARNESS_ROOT"/*) ;; *) exit 0 ;; esac
case "$f" in */node_modules/*|*/.git/*) exit 0 ;; esac
sd="$(state_dir)" && printf '%s\n' "$f" >> "$sd/touched"
p="$(bin prettier)" || exit 0
cd "$HARNESS_ROOT" 2>/dev/null || exit 0
"$p" --write --ignore-unknown --log-level warn "$f" >/dev/null 2>&1 || true
exit 0
