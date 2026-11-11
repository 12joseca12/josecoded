#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# Pre-commit: formatea con prettier los ficheros del commit y los vuelve a anadir al indice.
# Nunca bloquea: sin prettier, con prettier roto o fuera de un repo sale con 0. No toca:
#   - .claude/ (gestionado);
#   - ficheros parcialmente staged (con cambios sin anadir, o listados en los parches de lefthook);
#   - nada si el commit usa un indice temporal (git commit <rutas>).
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh" || exit 0
# La raiz es la del repo o worktree donde corre el hook, no CLAUDE_PROJECT_DIR.
root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
[ -n "$root" ] && cd "$root" 2>/dev/null || exit 0
HARNESS_ROOT="$(pwd -P)"
# Indice temporal (commit en modo "only"): formatear aqui no llegaria al arbol de trabajo.
if [ -n "${GIT_INDEX_FILE:-}" ]; then
  idx="$GIT_INDEX_FILE"; case "$idx" in /*) ;; *) idx="$PWD/$idx" ;; esac
  def="$(unset GIT_INDEX_FILE; git rev-parse --git-path index 2>/dev/null)" || exit 0
  case "$def" in /*) ;; *) def="$PWD/$def" ;; esac
  # `git commit -a` usa <gitdir>/index.lock: es el indice real. Cualquier otro (next-index-*.lock...) es temporal.
  idx="$(norm_path "$idx" 2>/dev/null)"; def="$(norm_path "$def" 2>/dev/null)"
  [ -n "$def" ] && { [ "$idx" = "$def" ] || [ "$idx" = "$def.lock" ]; } || exit 0
fi
p="$(bin prettier)" || exit 0
# Ficheros que lefthook ha guardado como cambios sin anadir (los vuelve a aplicar tras el hook).
hide="$(mktemp 2>/dev/null)" || exit 0
trap 'rm -f "$hide"' EXIT
for n in lefthook-unstaged.patch lefthook-unstaged-all.patch; do
  pf="$(git rev-parse --git-path "info/$n" 2>/dev/null)" || continue
  [ -s "$pf" ] || continue
  # nombres entrecomillados (caracteres raros): no se sabe leerlos con seguridad, no se formatea nada
  grep -Eq '^(---|\+\+\+) "' "$pf" && exit 0
  sed -n -e 's|^--- a/\(.*\)$|\1|p' -e 's|^+++ b/\(.*\)$|\1|p' "$pf" | sed 's/'"$(printf '\t')"'$//' >> "$hide"
done
while IFS= read -r -d '' f; do
  case "$f" in .claude/*|node_modules/*) continue ;; esac
  [ -f "$f" ] && [ ! -L "$f" ] || continue
  grep -Fxq -- "$f" "$hide" && continue
  git diff --quiet -- "$f" 2>/dev/null || continue
  "$p" --write --ignore-unknown --log-level warn "$f" >/dev/null 2>&1 || continue
  git add -- "$f" >/dev/null 2>&1 || true
done < <(git diff --cached --name-only -z --diff-filter=ACMR 2>/dev/null)
exit 0
