#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# PreToolUse (Bash): revisa tool_input.command contra guard.tsv (junto a este script).
#   guard.tsv: <deny|ask> TAB <regex ERE> TAB <motivo>; vacias y # se ignoran.
#   Placeholders en la regex: @S@ inicio de comando (tras ; & | ( ` { bash -c " eval, con sudo/VAR=x/ruta),
#   @X@ lanzador opcional (npx, pnpm [-F x] exec...), @V@ version opcional (@x.y), @SECRET@ nombre de fichero secreto.
# deny gana siempre sobre ask. Salida: JSON de PreToolUse, exit 0. Nunca falla por error interno.

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P)" || exit 0
. "$HOOK_DIR/lib.sh" 2>/dev/null || exit 0
TSV="$HOOK_DIR/guard.tsv"
[ -r "$TSV" ] || exit 0

json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"; s="${s//\"/\\\"}"; s="${s//$'\t'/ }"
  printf '%s' "$s"
}

emit() { # decision reason
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"%s","permissionDecisionReason":"%s"}}\n' "$1" "$(json_escape "$2")"
}

harness_read_input
cmd="$(json_get tool_input command)"
[ -n "$cmd" ] || exit 0

# Sin esto, bash >= 5.2 trata "&" del reemplazo como "lo encontrado" y rompe los placeholders.
shopt -u patsub_replacement 2>/dev/null

# Continuacion de linea (\ + salto) = espacio; el resto de saltos separan comandos.
cmd="${cmd//\\$'\n'/ }"
cmd="${cmd//$'\n'/;}"
# Fallo cerrado: comandos enormes o con muchisimos separadores no se pueden revisar.
too_long=0
if [ "${#cmd}" -gt 4096 ]; then
  too_long=1
else
  seps="${cmd//[^;&|]/}"
  [ "${#seps}" -gt 200 ] && too_long=2
fi
if [ "$too_long" = 1 ]; then
  emit ask "harness: comando demasiado largo para revisarlo. Pide confirmación a Jose antes de ejecutarlo."
  exit 0
fi
# Ofuscacion barata: comillas vacias ('' "") y barras invertidas no cambian el nombre del fichero.
cmd="${cmd//\'\'/}"; cmd="${cmd//\"\"/}"; cmd="${cmd//\\/}"
# Plantillas y ficheros de codigo (.env.example, .env.local.sample, .env.d.ts, .env.schema.ts...): legibles.
# Se neutralizan antes de buscar secretos, en una sola pasada (si no hay sed, queda como esta: mas estricto).
if command -v sed >/dev/null 2>&1; then
  cmd="$(printf '%s' "$cmd" | sed -E 's/\.env(\.[A-Za-z0-9_-]+)*\.(example|sample|template|dist|ts|js|mjs|cjs|json)([^A-Za-z0-9_.-]|$)/.envSAFE\3/g' 2>/dev/null)" || true
  [ -n "$cmd" ] || exit 0
fi

WRAP='((sudo|env|xargs|watch|nice)[[:space:]]+(-[-A-Za-z0-9=.]+[[:space:]]+)*|(exec|time|command|builtin|nohup)[[:space:]]+|[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*([^[:space:];&|]*/)?'
P_S='(^|[;&|(`{]|(^|[[:space:]])(then|do|else|elif|!)[[:space:]]+|-[a-z]*c[[:space:]]+["'"'"']|eval[[:space:]]+["'"'"']?)[[:space:]]*'"$WRAP"
P_X='((pnpm|yarn|npm|bun)[[:space:]]+((-F|--filter|-C|--dir|--prefix|-w|--workspace)[[:space:]]+[^[:space:]]+[[:space:]]+|--[a-z]+=[^[:space:]]+[[:space:]]+|-[a-zA-Z-]+[[:space:]]+)*(exec[[:space:]]+|run[[:space:]]+|dlx[[:space:]]+)?|(npx|bunx|pnpx)[[:space:]]+(-[-a-zA-Z]+[[:space:]]+)*)?'
P_V='(@[^[:space:]]+)?'
P_G='git([[:space:]]+(-[Cc][[:space:]]+[^[:space:]]+|--(git-dir|work-tree|namespace|exec-path)[[:space:]]+[^[:space:]]+|--[a-z-]+(=[^[:space:]]+)?|-[a-zA-Z]))*'
GL='[*?]|\[[^]]*\]'
P_SECRET='([^;&|]*[[:space:]"'"'"'=:/<>])?(\.(e|'"$GL"')(n|'"$GL"')(v|'"$GL"')(rc|\.[A-Za-z0-9_.*?-]*|\*)?|\.(e|'"$GL"')\*[A-Za-z0-9_.*?-]*|[^[:space:];&|"'"'"']*\.(pem|key|p12)|\.(d|'"$GL"')(e|'"$GL"')(v|'"$GL"')\.(v|'"$GL"')(a|'"$GL"')(r|'"$GL"')(s|'"$GL"')|\.dev\.v\*|id_(rsa|ed25519|ecdsa|dsa))(["'"'"'[:space:];&|)<>`]|$)'

ask_why=""
tab="$(printf '\t')"
while IFS="$tab" read -r dec re why || [ -n "$dec" ]; do
  case "$dec" in ''|'#'*) continue ;; esac
  [ -n "$re" ] || continue
  re="${re//@G@/$P_G}"; re="${re//@S@/$P_S}"; re="${re//@X@/$P_X}"; re="${re//@V@/$P_V}"; re="${re//@SECRET@/$P_SECRET}"
  if [[ "$cmd" =~ $re ]]; then
    case "$dec" in
      deny)
        msg="harness: comando bloqueado ($why). Si Jose lo ha autorizado, lo ejecuta él con \"! <comando>\"."
        printf '%s\n' "$msg" >&2
        emit deny "$msg"
        exit 0 ;;
      ask) [ -n "$ask_why" ] || ask_why="harness: $why. Pide confirmación a Jose antes de ejecutarlo." ;;
    esac
  fi
done < "$TSV"

[ -z "$ask_why" ] || { emit ask "$ask_why"; exit 0; }
[ "$too_long" = 2 ] && emit ask "harness: comando demasiado largo para revisarlo. Pide confirmación a Jose antes de ejecutarlo."
exit 0
