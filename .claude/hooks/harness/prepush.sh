#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# Pre-push: typecheck y tests de lo que cambia respecto a la rama base (sin lint). Tambien se puede lanzar a mano.
# Uso: prepush.sh [--base <rev>]
# Con stdin (git lo manda a los hooks pre-push: `<local ref> <local sha> <remote ref> <remote sha>` por linea) se
# verifica cada rama empujada: rango `remote sha..local sha`, o la rama base mas cercana si la rama es nueva. Se
# saltan borrados y tags. Solo se verifica la rama actual (lo que hay en disco); otra rama se avisa y no bloquea.
# Sin stdin (ejecucion manual): rango upstream o base mas cercana respecto a HEAD.
# Exit 1 solo si verify.sh encuentra errores en ficheros del rango. Sin base, sin git o con la herramienta rota:
# aviso (o nada) y exit 0.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P)" || exit 0
root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
[ -n "$root" ] && cd "$root" 2>/dev/null || exit 0
export CLAUDE_PROJECT_DIR="$root"   # never inherit another checkout's root
[ -x "$here/verify.sh" ] || exit 0

manual_base=""
[ "${1:-}" = "--base" ] && manual_base="${2:-}"

is_zero() { case "$1" in ""|*[!0]*) return 1 ;; *) return 0 ;; esac; }

# pick_base <tip> <branch name to skip>: the nearest candidate (fewest commits between merge-base and tip);
# remote candidates (origin/*) win over local ones, a local main may be ahead of what the remote has.
pick_base() {
  local tip="$1" skip="$2" head_target group c name mb n best="" bestn=""
  head_target="$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null)"
  for group in "origin/HEAD origin/main origin/master origin/develop" "main master develop"; do
    for c in $group; do
      git rev-parse --verify -q "$c^{commit}" >/dev/null 2>&1 || continue
      name="$c"; [ "$c" = origin/HEAD ] && name="$head_target"
      [ -n "$skip" ] && { [ "$name" = "$skip" ] || [ "$name" = "origin/$skip" ]; } && continue
      mb="$(git merge-base "$c" "$tip" 2>/dev/null)" || continue
      n="$(git rev-list --count "$mb..$tip" 2>/dev/null)" || continue
      if [ -z "$best" ] || [ "$n" -lt "$bestn" ]; then best="$c"; bestn="$n"; fi
    done
    [ -n "$best" ] && break
  done
  printf '%s' "$best"
}

dirty_warning() { # tracked changes and untracked, not ignored, files (the forgotten `git add`)
  local list n
  list="$(git -c core.quotePath=false status --porcelain --untracked-files=normal 2>/dev/null | cut -c4-)"
  [ -n "$list" ] || return 0
  n="$(printf '%s\n' "$list" | wc -l | tr -d ' ')"
  echo "!! harness: hay cambios sin commitear o ficheros sin seguimiento ($(printf '%s\n' "$list" | head -n 5 | tr '\n' ' ')$([ "$n" -gt 5 ] && echo "y $((n-5)) mas")); se verifica lo que hay en disco"
}

blocked=0
# verify_range <base> <1 if base is the remote/upstream state, 0 if it was guessed>
verify_range() {
  local base="$1" mb cnt
  mb="$(git merge-base "$base" HEAD 2>/dev/null)"
  if [ -n "$mb" ]; then
    cnt="$(git rev-list --count "$mb..HEAD" 2>/dev/null)"
    [ "$cnt" = 0 ] && [ "$2" != 1 ] && echo "!! harness: el rango respecto a $base esta vacio; no se verifica nada"
  fi
  dirty_warning
  "$here/verify.sh" --no-lint --since "$base"; [ $? -eq 1 ] && blocked=1
  return 0
}
if [ ! -x node_modules/.bin/tsc ] && [ ! -x node_modules/.bin/vitest ] && [ ! -x node_modules/.bin/jest ]; then
  echo '!! harness: no hay tsc ni test runner en node_modules; no se verifica'
  exit 0
fi

lines=""
if [ -z "$manual_base" ] && [ ! -t 0 ]; then
  while IFS= read -r l; do [ -n "$l" ] && lines="$lines$l
"; done
fi

if [ -n "$lines" ]; then
  head_sha="$(git rev-parse HEAD 2>/dev/null)"
  while IFS=' ' read -r lref lsha rref rsha; do
    [ -n "$lref" ] || continue
    is_zero "$lsha" && continue                      # branch deletion
    case "$lref$rref" in *refs/tags/*) continue ;; esac
    if [ "$lsha" != "$head_sha" ]; then
      echo "!! harness: no se verifica ${lref} (no es la rama actual)"
      continue
    fi
    if ! is_zero "$rsha" && git cat-file -e "$rsha^{commit}" 2>/dev/null; then
      verify_range "$rsha" 1
    else
      cur="${lref#refs/heads/}"; [ "$cur" = "$lref" ] && cur="$(git symbolic-ref -q --short HEAD 2>/dev/null)"
      base="$(pick_base HEAD "$cur")"
      if [ -z "$base" ]; then echo '!! harness: pre-push sin rama base; no se verifica'; continue; fi
      verify_range "$base" 0
    fi
  done <<EOT
$lines
EOT
else
  base="$manual_base"; up=0
  if [ -z "$base" ]; then
    base="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)" && up=1 || base=""
  fi
  [ -n "$base" ] || base="$(pick_base HEAD "$(git symbolic-ref -q --short HEAD 2>/dev/null)")"
  if [ -z "$base" ]; then echo '!! harness: pre-push sin rama base; no se verifica'; exit 0; fi
  verify_range "$base" "$up"
fi

if [ "$blocked" = 1 ]; then
  echo 'pre-push bloqueado por el harness: corrige lo de arriba y vuelve a hacer push.'
  exit 1
fi
exit 0
