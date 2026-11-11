#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# PostToolUse (Bash): apunta en `touched` los ficheros modificados o nuevos (no ignorados por git) con
# mtime posterior a bash-start, para que Stop los verifique como los de Write/Edit. No formatea. Nunca bloquea.
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh" 2>/dev/null || exit 0
harness_read_input
sd="$(state_dir)" || exit 0
m="$sd/bash-start"
[ -e "$m" ] || exit 0
command -v git >/dev/null 2>&1 || exit 0
cd "$HARNESS_ROOT" 2>/dev/null || exit 0
t="$sd/touched"
while IFS= read -r -d '' rel; do
  [ -n "$rel" ] && [ -f "$rel" ] && [ ! -L "$rel" ] || continue
  [ ! "$m" -nt "$rel" ] || continue
  f="$(norm_path "$HARNESS_ROOT/$rel")" || continue
  case "$f" in "$HARNESS_ROOT"/*) ;; *) continue ;; esac
  case "$f" in */node_modules/*|*/.git/*|*/.claude/*) continue ;; esac
  grep -qxF -- "$f" "$t" 2>/dev/null || printf '%s\n' "$f" >> "$t"
done < <(git -c core.quotePath=false ls-files -m -o --exclude-standard -z 2>/dev/null)
exit 0
