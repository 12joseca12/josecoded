#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# Verificacion de ficheros concretos (nunca el proyecto entero): typecheck, lint, css, formato, tests.
# Uso: verify.sh [--no-tests] [--format-check] (--staged | --files-from <fichero> | -- <f>...)
# Exit 0 si todo pasa, se salta o solo hay avisos; 1 si falla algo atribuible a los ficheros de la lista
# (imprime `--- <nombre> ---` y las ultimas 40 lineas). Los avisos (fallo de la herramienta, errores en
# ficheros ajenos) salen en stdout como lineas `!! harness: ...` y no cuentan como fallo.
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh" || exit 0

CALLER_PWD="$PWD"
no_tests=0; fmt=0; mode=""; src=""
while [ $# -gt 0 ]; do
  case "$1" in
    --no-tests) no_tests=1; shift ;;
    --format-check) fmt=1; shift ;;
    --staged) mode=staged; shift ;;
    --files-from) mode=from; src="${2:-}"; shift; [ $# -gt 0 ] && shift ;;
    --) mode=args; shift; break ;;
    *) shift ;;
  esac
done

raw="$(mktemp 2>/dev/null)" || exit 0
trap 'rm -f "$raw" "$raw.l" "$raw.t"' EXIT
base="$CALLER_PWD"   # relative inputs resolve against the caller's cwd (staged ones against the root)
case "$mode" in
  staged) base="$HARNESS_ROOT"
    git -C "$HARNESS_ROOT" -c core.quotePath=false diff --cached --name-only --relative --diff-filter=ACMR 2>/dev/null > "$raw" ;;
  from) case "$src" in /*|"") ;; *) src="$CALLER_PWD/$src" ;; esac
    [ -n "$src" ] && [ -f "$src" ] && cat "$src" > "$raw" ;;
  args) for f in "$@"; do printf '%s\n' "$f"; done > "$raw" ;;
esac

cd "$HARNESS_ROOT" 2>/dev/null || exit 0

# Normalize: absolute path inside the project, existing regular file, not node_modules/.git, unique.
while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$f" in /*) ;; *) f="$base/$f" ;; esac
  [ -f "$f" ] || continue
  f="$(norm_path "$f")" || continue
  case "$f" in "$HARNESS_ROOT"/*) ;; *) continue ;; esac
  case "$f" in */node_modules/*|*/.git/*) continue ;; esac
  printf '%s\n' "$f"
done < "$raw" | LC_ALL=C sort -u > "$raw.l"

all=""; ts=""; code=""; css=""
while IFS= read -r f; do
  all="$all$f
"
  case "$f" in
    *.ts|*.tsx|*.mts|*.cts) ts="$ts$f
"; code="$code$f
" ;;
    *.js|*.jsx|*.mjs|*.cjs) code="$code$f
" ;;
    *.css) css="$css$f
" ;;
  esac
done < "$raw.l"
[ -n "$all" ] || exit 0

failed=0
# capture <files (one per line)> <cmd> [args...]: runs cmd with the files as last args; sets CAP_OUT, CAP_RC.
capture() {
  local files="$1" f; shift
  while IFS= read -r f; do [ -n "$f" ] && set -- "$@" "$f"; done <<EOT
$files
EOT
  CAP_OUT="$("$@" 2>&1)"; CAP_RC=$?
  strip_ansi
}
# Colour codes (FORCE_COLOR, pretty output) would break the parsing below.
strip_ansi() { CAP_OUT="$(printf '%s' "$CAP_OUT" | LC_ALL=C sed "s/$(printf '\033')\[[0-9;]*m//g")"; }
# Output typical of a broken installation, not of a failed check.
tool_broken() { printf '%s' "$CAP_OUT" | grep -qE 'Cannot find module|MODULE_NOT_FOUND'; }
report() { # name [text]: failure block (last 40 lines of the text, default the last capture)
  failed=1; printf -- '--- %s ---\n' "$1"; printf '%s\n' "${2-$CAP_OUT}" | tail -n 40
}
warn() { printf '!! harness: %s\n' "$*"; }
tool_failed() { # name: warning for a tool that could not run (first line of its output)
  warn "$1 no se pudo ejecutar ($(printf '%s' "$CAP_OUT" | sed -n '/[^[:space:]]/{p;q;}' | cut -c1-160))"
}
# run_check <name> <files> <cmd> [args...]: rc 1 = check failed; rc 2 (eslint/prettier) = the tool broke.
run_check() {
  local name="$1"; shift
  capture "$@"
  [ "$CAP_RC" -eq 0 ] && return 0
  if [ "$CAP_RC" -ge 2 ] || tool_broken; then tool_failed "$name"; else report "$name"; fi
}
is_mine() { grep -Fxq -- "$1" "$raw.l"; }   # abs path in the checked list
abs() { # path (relative to root or absolute) -> normalized absolute path
  local p="${1#./}"; case "$p" in /*) ;; *) p="$HARNESS_ROOT/$p" ;; esac
  norm_path "$p" 2>/dev/null || printf '%s\n' "$p"
}

# --- typecheck: only errors located in the checked files block ---
if [ -n "$ts" ] && [ -f tsconfig.json ] && t="$(bin tsc)"; then
  mkdir -p node_modules/.cache/harness 2>/dev/null
  CAP_OUT="$("$t" --noEmit --pretty false --incremental --tsBuildInfoFile node_modules/.cache/harness/tsc.tsbuildinfo 2>&1)"; CAP_RC=$?
  strip_ansi
  if [ "$CAP_RC" -ne 0 ]; then
    if ! printf '%s\n' "$CAP_OUT" | grep -q 'error TS'; then
      tool_failed tsc
    else
      mine=""; other=0; other_first=""; inmine=0
      while IFS= read -r line; do
        p="$(printf '%s' "$line" | sed -n 's/^\(.*\)([0-9][0-9]*,[0-9][0-9]*): error TS.*/\1/p')"
        if [ -z "$p" ]; then
          # indented continuation lines belong to the previous error
          case "$line" in [[:space:]]*) [ "$inmine" = 1 ] && mine="$mine$line
" ;; *) inmine=0 ;; esac
          continue
        fi
        if is_mine "$(abs "$p")"; then inmine=1; mine="$mine$line
"; else inmine=0; other=$((other+1)); [ -n "$other_first" ] || other_first="$p"; fi
      done <<EOT
$CAP_OUT
EOT
      if [ -n "$mine" ]; then report typecheck "$mine"
      elif [ "$other" -gt 0 ]; then warn "errores de tipos en ficheros no tocados: $other (p. ej. $other_first)"
      else tool_failed tsc; fi
    fi
  fi
fi

# --- lint ---
if [ -n "$code" ] && t="$(bin eslint)" && ls eslint.config.* >/dev/null 2>&1; then
  run_check lint "$code" "$t" --no-warn-ignored --
fi

has_stylelint_config() { local c; for c in .stylelintrc* stylelint.config.*; do [ -e "$c" ] && return 0; done; return 1; }
# --- css: only with a stylelint config ---
if [ -n "$css" ] && t="$(bin stylelint)" && { has_stylelint_config ||
  grep -q '"stylelint"[[:space:]]*:' package.json 2>/dev/null; }; then
  # stylelint: 2 = lint problems (block); 1, 78, 64... = the tool failed (warn).
  capture "$css" "$t" --allow-empty-input --
  if [ "$CAP_RC" -eq 0 ]; then :
  elif [ "$CAP_RC" -eq 2 ] && ! tool_broken; then report lint:css
  else tool_failed lint:css; fi
fi

# --- format ---
if [ "$fmt" = 1 ] && t="$(bin prettier)"; then
  run_check format "$all" "$t" --check --ignore-unknown --
fi

# --- tests ---
# failed_tests_attributable <output>: 0 if some failed test file is checked or is a sibling (x.test.* of x.*).
failed_tests_attributable() {
  local tf tb f
  printf '%s\n' "$1" | sed -n -e 's/^ *FAIL  *\([^ ]*\).*/\1/p' -e 's/^ *❯  *\([^ ]*\).*/\1/p' |
    sed 's/:[0-9][0-9]*\(:[0-9][0-9]*\)\{0,1\}$//' | grep -E '\.(test|spec)\.[a-z]+$' | LC_ALL=C sort -u > "$raw.t"
  FAILED_TESTS="$(cat "$raw.t")"
  while IFS= read -r tf; do
    [ -n "$tf" ] || continue
    tf="$(abs "$tf")"
    is_mine "$tf" && return 0
    tb="$(printf '%s' "${tf%.*}" | sed -E 's/\.(test|spec)$//')"
    while IFS= read -r f; do [ "${f%.*}" = "$tb" ] && return 0; done < "$raw.l"
  done < "$raw.t"
  return 1
}
if [ "$no_tests" = 0 ] && [ -n "$code" ]; then
  if t="$(bin vitest)"; then
    capture "$code" "$t" related --run --passWithNoTests
    if [ "$CAP_RC" -eq 0 ]; then :
    elif printf '%s' "$CAP_OUT" | grep -q 'Test Files'; then report tests
    elif tool_broken; then tool_failed vitest
    elif printf '%s' "$CAP_OUT" | grep -q 'Unhandled Error'; then
      # `vitest related` analyses the whole import graph; if that analysis itself crashes (e.g. an unplugged
      # .mdx import, as in josecoded) it is not a test failure: fall back to the full suite (`vitest run`).
      capture "" "$t" run --passWithNoTests
      if [ "$CAP_RC" -eq 0 ]; then :
      elif ! printf '%s' "$CAP_OUT" | grep -q 'Test Files'; then tool_failed vitest
      elif failed_tests_attributable "$CAP_OUT"; then report tests
      else warn "tests de ficheros no tocados fallan en la suite completa ($(printf '%s' "$FAILED_TESTS" | sed -n '1p'))"
      fi
    else tool_failed vitest
    fi
  elif t="$(bin jest)"; then
    capture "$code" "$t" --findRelatedTests --passWithNoTests
    if [ "$CAP_RC" -eq 0 ]; then :
    elif printf '%s' "$CAP_OUT" | grep -qE '^(Tests|Test Suites):'; then report tests
    else tool_failed jest; fi
  fi
fi

[ "$failed" = 0 ] && exit 0
exit 1
