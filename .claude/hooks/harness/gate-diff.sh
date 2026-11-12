#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# gate-diff.sh: clasifica las rutas de un diff en categorias de puerta de calidad y dice que verificadores entran.
# Uso: gate-diff.sh [--level S|M|L] [--base <rev>] [--files-from <fichero> | --stdin] [--agents-dir <dir>]... [--trust-dir]
#   --trust-dir: solo para /puerta-calidad, que ejecuta una copia de la puerta extraida del merge-base fuera del repo. Desactiva solo
#     la comprobacion de script fuera del repo/enlaces; la ruta de la puerta es .claude/hooks/harness y se compara la copia que corre
#     con la del arbol de trabajo (info puerta + datos forzado).
#   --base es excluyente con --files-from/--stdin, y estos dos entre si (exit 2).
#   --agents-dir SUSTITUYE a los directorios de agentes por defecto (proyecto y config del usuario); repetible.
#   Base por defecto: origin/HEAD; si no, la primera de origin/main origin/master origin/develop main master develop (sin la rama actual).
# Salida (TAB): gate / file / cat / run / skip / info / rest / restfile. Exit 0 al clasificar, 2 en error de uso o entorno.
set -u
export LC_ALL=C
HERE="$(cd "$(dirname "$0")" && pwd -P)"
CATS="ui motion datos publica rendimiento flujos"

die() { echo "!! gate: $*" >&2; exit 2; }

LEVEL=M BASE="" FILES_FROM="" USE_STDIN=0 ADIRS=() TRUST=0
while [ $# -gt 0 ]; do
  case "$1" in
    --level) [ $# -ge 2 ] || die "--level pide un valor"; LEVEL="$2"; shift 2 ;;
    --base) [ $# -ge 2 ] || die "--base pide un valor"; BASE="$2"; shift 2 ;;
    --files-from) [ $# -ge 2 ] || die "--files-from pide un fichero"; FILES_FROM="$2"; shift 2 ;;
    --stdin) USE_STDIN=1; shift ;;
    --agents-dir) [ $# -ge 2 ] || die "--agents-dir pide un directorio"; ADIRS+=("$2"); shift 2 ;;
    --trust-dir) TRUST=1; shift ;;
    *) die "argumento desconocido: $1" ;;
  esac
done
case "$LEVEL" in S|M|L) ;; *) die "nivel invalido: $LEVEL (S, M o L)" ;; esac
[ -n "$FILES_FROM" ] && [ "$USE_STDIN" = 1 ] && die "--files-from y --stdin son excluyentes"
if [ -n "$FILES_FROM" ] || [ "$USE_STDIN" = 1 ]; then [ -z "$BASE" ] || die "--base no se combina con --files-from/--stdin"; fi
[ -f "$HERE/gate.tsv" ] || die "falta $HERE/gate.tsv"
[ -f "$HERE/gate-agents.tsv" ] || die "falta $HERE/gate-agents.tsv"

TMP="$(mktemp -d)" || die "no se pudo crear un directorio temporal"
trap 'rm -rf "$TMP"' EXIT
FILES="$TMP/files"

is_cat() { local c; for c in $CATS; do [ "$c" = "$1" ] && return 0; done; return 1; }

# ---- 1. Lista de ficheros y base ----
BASE_SHORT="-"; MODE=git; MB=""
RULES="$HERE/gate.tsv"; AGENTSF="$HERE/gate-agents.tsv"; : > "$TMP/selfchanged"
if [ -n "$FILES_FROM" ] || [ "$USE_STDIN" = 1 ]; then
  if [ "$USE_STDIN" = 1 ]; then cat > "$TMP/raw" || die "no se pudo leer stdin"; else
    [ -f "$FILES_FROM" ] || die "no existe $FILES_FROM"
    cat "$FILES_FROM" > "$TMP/raw" || die "no se pudo leer $FILES_FROM"
  fi
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"; MODE=list
else
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || die "no es un repositorio git"
  if [ -z "$BASE" ]; then
    # Sin @{upstream}: en una rama ya subida apunta a origin/<misma-rama> y el diff saldria vacio.
    CUR="$(git -C "$ROOT" symbolic-ref -q --short HEAD 2>/dev/null)" || CUR=""
    for c in origin/HEAD origin/main origin/master origin/develop main master develop; do
      [ "$c" = "$CUR" ] && continue
      if git -C "$ROOT" rev-parse --verify -q "$c^{commit}" >/dev/null 2>&1; then BASE="$c"; break; fi
    done
  fi
  [ -n "$BASE" ] || die "sin rama base (usa --base <rev>)"
  MB="$(git -C "$ROOT" merge-base "$BASE" HEAD 2>/dev/null)" || die "sin merge-base entre $BASE y HEAD"
  BASE_SHORT="$(git -C "$ROOT" rev-parse --short=12 "$MB")" || die "rev-parse fallo"
  git -C "$ROOT" diff --name-only --no-renames -z "$MB" -- > "$TMP/z1" || die "git diff fallo"
  git -C "$ROOT" ls-files --others --exclude-standard -z > "$TMP/z2" || die "git ls-files fallo"
  tr '\0' '\n' < "$TMP/z2" > "$TMP/untracked" || die "tr fallo"
  cat "$TMP/z1" "$TMP/z2" | tr '\0' '\n' > "$TMP/raw" || die "tr fallo"
  # Integridad de la propia puerta: si la rama toca gate.tsv, gate-agents.tsv o este script, se clasifica con
  # las reglas de la base de la rama, se fuerza datos (seguridad) y se avisa con una linea info.
  # El script y sus tablas tienen que vivir dentro del repo, sin enlaces simbolicos en .claude/hooks/harness:
  # si no, la rama podria sustituirlos por otros y la comprobacion de abajo no vale nada (exit 2 -> puerta completa).
  if [ "$TRUST" = 1 ]; then
    case "$HERE" in "$ROOT"/*) die "--trust-dir con el script dentro del repo ($HERE): solo vale para una copia de la base fuera de el" ;; esac
    # Copia de la base ejecutada desde fuera: se compara con lo que hay en el arbol de trabajo en la ruta fija.
    HREL=".claude/hooks/harness"
    for gf in gate.tsv gate-agents.tsv gate-diff.sh; do
      if [ -L "$ROOT/.claude" ] || [ -L "$ROOT/.claude/hooks" ] || [ -L "$ROOT/$HREL" ] || [ -L "$ROOT/$HREL/$gf" ] \
         || [ ! -f "$ROOT/$HREL/$gf" ] || ! cmp -s "$HERE/$gf" "$ROOT/$HREL/$gf"; then
        echo "$HREL/$gf" >> "$TMP/selfchanged"
      fi
    done
    cat "$TMP/selfchanged" >> "$TMP/raw"
  else
    for sl in .claude .claude/hooks .claude/hooks/harness; do
      [ -L "$ROOT/$sl" ] && die "$sl es un enlace simbolico: no se puede confiar en la puerta instalada"
    done
    case "$HERE" in "$ROOT"/*) ;; *) die "el script esta fuera del repo ($HERE): no se puede verificar su integridad" ;; esac
    case "$HERE" in
      "$ROOT"/*)
        HREL="${HERE#"$ROOT"/}"
        for gf in gate.tsv gate-agents.tsv gate-diff.sh; do
          if git -C "$ROOT" cat-file -e "$MB:$HREL/$gf" 2>/dev/null; then
            git -C "$ROOT" show "$MB:$HREL/$gf" > "$TMP/base.$gf" || die "git show fallo: $HREL/$gf"
            cmp -s "$TMP/base.$gf" "$HERE/$gf" || echo "$HREL/$gf" >> "$TMP/selfchanged"
            case "$gf" in gate.tsv) RULES="$TMP/base.gate.tsv" ;; gate-agents.tsv) AGENTSF="$TMP/base.gate-agents.tsv" ;; esac
          else
            echo "$HREL/$gf" >> "$TMP/selfchanged"
          fi
        done
        cat "$TMP/selfchanged" >> "$TMP/raw"
        ;;
    esac
  fi
fi
sed -e 's#^\./##' -e '/^$/d' "$TMP/raw" | sort -u > "$FILES" || die "no se pudo preparar la lista de ficheros"
if [ "$MODE" = list ]; then   # una lista dada que toca la puerta instalada: datos forzado y aviso
  grep -F -e '.claude/hooks/harness/' "$FILES" | grep -E '^\.claude/hooks/harness/' > "$TMP/selfchanged"
  [ "$?" -le 1 ] || die "grep fallo"
fi
NFILES="$(wc -l < "$FILES" | tr -d ' ')"

# Contenido para las reglas de 4.a columna (ruta SOH linea), solo si alguna regla la usa.
#   ADDED:  lineas anadidas (todas las categorias salvo datos).
#   DATOSC: anadidas + eliminadas + contenido ENTERO de la base y de la cabeza de cada fichero cambiado (solo datos).
# git: diff -U0 de lo modificado (una sola vez) + ficheros sin seguir enteros; lista dada: ficheros enteros del disco.
# Rutas con comillas en la cabecera del diff (", \, TAB, control): se leen enteras (disco, o la base si ya no existen).
ADDED="$TMP/added"; DATOSC="$TMP/datosc"; ADDED_BUILT=0
emit_disk() { # $1 = ruta: vuelca "ruta SOH linea" si existe en disco; error si existe y no se puede leer
  [ -f "$ROOT/$1" ] || return 0
  [ -r "$ROOT/$1" ] || die "no se puede leer $1"
  P="$1" awk 'BEGIN { p = ENVIRON["P"] } { print p "\001" $0 }' "$ROOT/$1" || die "awk fallo leyendo $1"
}
emit_base() { # $1 = ruta: vuelca el contenido de la base de la rama si existe alli
  git -C "$ROOT" cat-file -e "$MB:$1" 2>/dev/null || return 0
  git -C "$ROOT" show "$MB:$1" > "$TMP/blob" || die "git show fallo: $1"
  P="$1" awk 'BEGIN { p = ENVIRON["P"] } { print p "\001" $0 }' "$TMP/blob" || die "awk fallo leyendo la base de $1"
}
cat_files() { local f; while IFS= read -r f; do emit_disk "$f"; done; }
build_added() {
  [ "$ADDED_BUILT" = 1 ] && return 0
  ADDED_BUILT=1; : > "$ADDED"; : > "$DATOSC"
  if [ "$MODE" = list ]; then cat_files < "$FILES" > "$ADDED"; cp "$ADDED" "$DATOSC" || die "cp fallo"; return 0; fi
  git -C "$ROOT" -c core.quotepath=off diff -U0 --no-color --no-renames --no-ext-diff --no-textconv --text --src-prefix=a/ --dst-prefix=b/ "$MB" -- > "$TMP/udiff" || die "git diff -U0 fallo"
  awk -v addf="$ADDED" -v datf="$DATOSC" '
    function hdr(p) { sub(/\t$/, "", p); if (p == "/dev/null" || substr(p, 1, 1) == "\"") return ""; return substr(p, 3) }
    rem > 0 {
      c = substr($0, 1, 1)
      if (c == "+") { if (path != "") { print path "\001" substr($0, 2) >> addf; print path "\001" substr($0, 2) >> datf }; rem-- }
      else if (c == "-") { rp = (path != "" ? path : oldp); if (rp != "") print rp "\001" substr($0, 2) >> datf; rem-- }
      next
    }
    /^diff --git / { path = ""; oldp = ""; next }
    /^--- / { oldp = hdr(substr($0, 5)); next }
    /^\+\+\+ / { path = hdr(substr($0, 5)); next }
    /^@@ / { split(substr($2, 2), A, ","); split(substr($3, 2), B, ",")
             rem = (A[2] == "" ? 1 : A[2]) + (B[2] == "" ? 1 : B[2]); next }
  ' "$TMP/udiff" || die "awk fallo analizando el diff"
  cat_files < "$TMP/untracked" > "$TMP/part"; cat "$TMP/part" >> "$ADDED"; cat "$TMP/part" >> "$DATOSC"
  # rutas tracked con caracteres especiales: ficheros enteros (disco y base) para todas las categorias
  tr '\0' '\n' < "$TMP/z1" | grep -E '["\\]|[[:cntrl:]]' > "$TMP/special"
  [ "$?" -le 1 ] || die "grep fallo"
  : > "$TMP/part"
  while IFS= read -r f; do emit_disk "$f" >> "$TMP/part"; emit_base "$f" >> "$TMP/part"; done < "$TMP/special"
  cat "$TMP/part" >> "$ADDED"; cat "$TMP/part" >> "$DATOSC"
  # datos: contenido entero de la cabeza y de la base de cada fichero cambiado o nuevo
  tr '\0' '\n' < "$TMP/z1" > "$TMP/z1.txt" || die "tr fallo"
  : > "$TMP/part"
  while IFS= read -r f; do [ -n "$f" ] || continue; emit_disk "$f" >> "$TMP/part"; emit_base "$f" >> "$TMP/part"; done < "$TMP/z1.txt"
  cat "$TMP/part" >> "$DATOSC"
}

# ---- 2. Reglas: una pasada de grep -E por regla sobre toda la lista ----
MATCHES="$TMP/matches"; : > "$MATCHES"
n=0
while IFS="$(printf '\t')" read -r cat ere motivo content || [ -n "${cat:-}" ]; do
  n=$((n+1))
  case "${cat:-}" in ''|'#'*) continue ;; esac
  kind=i; name="$cat"
  case "$cat" in -*) kind=x; name="${cat#-}" ;; esac
  if [ "$name" = "*" ] && [ "$kind" = x ]; then :; elif ! is_cat "$name"; then
    die "gate.tsv linea $n: categoria desconocida '$cat'"
  fi
  [ -n "${ere:-}" ] || die "gate.tsv linea $n: falta la expresion"
  gflag=-E; [ "$kind" = i ] && [ "$name" = datos ] && gflag=-iE   # datos no distingue mayusculas
  : | grep "$gflag" -e "$ere" >/dev/null 2>&1; rc=$?
  [ "$rc" -le 1 ] || die "gate.tsv linea $n: expresion invalida '$ere'"
  grep -n "$gflag" -e "$ere" "$FILES" > "$TMP/pl0" 2>/dev/null; rc=$?
  [ "$rc" -le 1 ] || die "grep fallo en la regla de la linea $n"
  sed 's/:.*//' "$TMP/pl0" > "$TMP/pl" || die "sed fallo"
  if [ -n "${content:-}" ]; then
    echo x | RE="$content" awk 'BEGIN { re = ENVIRON["RE"] } { x = ($0 ~ re) }' >/dev/null 2>&1 || die "gate.tsv linea $n: expresion de contenido invalida '$content'"
    build_added
    # rutas con alguna linea cambiada que casa -> numero de linea en FILES -> interseccion con las de ruta
    csrc="$ADDED"; [ "$name" = datos ] && csrc="$DATOSC"
    RE="$content" awk -F'\001' 'BEGIN { re = ENVIRON["RE"] } { l = substr($0, index($0, "\001") + 1); if (l ~ re) print $1 }' "$csrc" > "$TMP/cp0" || die "awk fallo (contenido, linea $n)"
    sort -u "$TMP/cp0" > "$TMP/cpaths" || die "sort fallo"
    awk 'NR == FNR { c[$0] = 1; next } ($0 in c) { print FNR }' "$TMP/cpaths" "$FILES" > "$TMP/cl" || die "awk fallo (interseccion, linea $n)"
    grep -Fxf "$TMP/cl" "$TMP/pl" > "$TMP/pl2" 2>/dev/null; rc=$?
    [ "$rc" -le 1 ] || die "grep fallo (interseccion, linea $n)"
    mv "$TMP/pl2" "$TMP/pl" || die "mv fallo"
  fi
  while IFS= read -r ln; do
    printf '%s\t%s\t%s\t%s\n' "$kind" "$name" "$ln" "${motivo:-}"
  done < "$TMP/pl" >> "$MATCHES"
done < "$RULES"
# puerta modificada en la rama: datos forzado, ni siquiera una exclusion de la rama lo quita
while IFS= read -r sp; do
  [ -n "$sp" ] || continue
  ln="$(grep -nFx -- "$sp" "$FILES" | head -1 | cut -d: -f1)"
  [ -n "$ln" ] && printf 'f\tdatos\t%s\tpuerta modificada en la rama\n' "$ln" >> "$MATCHES"
done < "$TMP/selfchanged"

# ---- 3. Clasificacion (awk: primera regla gana, exclusion gana siempre salvo lo forzado) ----
CLASS="$TMP/class"   # file|rest <TAB> cat <TAB> ruta <TAB> motivo <TAB> n.o de linea en FILES
awk -F'\t' -v cats="$CATS" -v mf="$MATCHES" '
  BEGIN { nc = split(cats, C, " ") }
  FILENAME == mf {
    if ($1 == "x") { if ($2 == "*") { for (i = 1; i <= nc; i++) ex[C[i], $3] = 1 } else ex[$2, $3] = 1 }
    else { if (!(($2, $3) in inc)) inc[$2, $3] = $4; if ($1 == "f") fx[$2, $3] = 1 }
    next
  }
  {
    path = $0; shown = path; gsub(/\t/, "\\t", shown); any = 0
    for (i = 1; i <= nc; i++) {
      if ((C[i], FNR) in inc && (!((C[i], FNR) in ex) || ((C[i], FNR) in fx))) { print "file\t" C[i] "\t" shown "\t" inc[C[i], FNR] "\t" FNR; any = 1 }
    }
    if (!any) print "rest\t\t" shown "\t\t" FNR
  }
' "$MATCHES" "$FILES" > "$CLASS" || die "awk de clasificacion fallo"
# todo fichero de la lista tiene que aparecer en una linea file o rest
COVERED="$(cut -f5 "$CLASS" | sort -u | wc -l | tr -d ' ')"
[ "$COVERED" = "$NFILES" ] || die "clasificacion incompleta: $COVERED de $NFILES ficheros"

count_cat() { awk -F'\t' -v c="$1" '$1 == "file" && $2 == c { n++ } END { print n + 0 }' "$CLASS"; }
cnt_ui=$(count_cat ui); cnt_motion=$(count_cat motion); cnt_datos=$(count_cat datos)
cnt_publica=$(count_cat publica); cnt_rendimiento=$(count_cat rendimiento); cnt_flujos=$(count_cat flujos)
cnt_of() { case "$1" in ui) echo "$cnt_ui" ;; motion) echo "$cnt_motion" ;; datos) echo "$cnt_datos" ;; publica) echo "$cnt_publica" ;; rendimiento) echo "$cnt_rendimiento" ;; flujos) echo "$cnt_flujos" ;; *) echo 0 ;; esac; }

# ---- 4. Roles, agentes y niveles ----
if [ ${#ADIRS[@]} -eq 0 ]; then
  # Unica lectura fuera del repo: solo comprueba si existe el agente.
  ADIRS=("$ROOT/.claude/agents" "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/agents") # harness:permitir-home-claude
fi
agent_exists() { local d; for d in "${ADIRS[@]}"; do [ -f "$d/$1.md" ] && return 0; done; return 1; }

# gate-agents.tsv -> una linea por rol: rol<TAB>alias<TAB>categorias (en orden de aparicion)
n=0
: > "$TMP/roles.raw"
while IFS="$(printf '\t')" read -r acat arole aalias || [ -n "${acat:-}" ]; do
  n=$((n+1))
  case "${acat:-}" in ''|'#'*) continue ;; esac
  if [ "$acat" != L ] && ! is_cat "$acat"; then die "gate-agents.tsv linea $n: categoria desconocida '$acat'"; fi
  [ -n "${arole:-}" ] || die "gate-agents.tsv linea $n: falta el rol"
  printf '%s\t%s\t%s\n' "$arole" "${aalias:-}" "$acat" >> "$TMP/roles.raw"
done < "$AGENTSF"
awk -F'\t' '
  { if (!($1 in seen)) { seen[$1] = 1; order[++n] = $1; alias[$1] = $2 }
    else if (alias[$1] == "") alias[$1] = $2
    cats[$1] = cats[$1] (cats[$1] == "" ? "" : ",") $3 }
  END { for (i = 1; i <= n; i++) print order[i] "|" alias[order[i]] "|" cats[order[i]] }' "$TMP/roles.raw" > "$TMP/roles" || die "gate-agents.tsv ilegible"

DECISION="$TMP/decision"; : > "$DECISION"
if [ -s "$TMP/selfchanged" ]; then
  printf 'info\tpuerta\t%s\tmodificada-en-la-rama\n' "$(paste -sd, "$TMP/selfchanged")" >> "$DECISION"
fi
while IFS="|" read -r role alias cats; do
  # categorias del rol pedidas por el diff (en L: todas las suyas)
  req=""
  OLDIFS="$IFS"; IFS=,
  for c in $cats; do
    if [ "$LEVEL" = L ] || [ "$(cnt_of "$c")" -gt 0 ]; then req="$req${req:+,}$c"; fi
  done
  IFS="$OLDIFS"
  [ -n "$req" ] || continue
  if [ "$LEVEL" = S ]; then
    case ",$req," in
      *,datos,*) ;;
      *) printf 'info\t%s\t%s\tnivel-S\n' "$role" "$req" >> "$DECISION"; continue ;;
    esac
  fi
  agent=""
  if agent_exists "$role"; then agent="$role"
  elif [ -n "$alias" ] && agent_exists "$alias"; then agent="$alias"; fi
  if [ -n "$agent" ]; then printf 'run\t%s\t%s\t%s\n' "$agent" "$role" "$req" >> "$DECISION"
  else printf 'skip\t%s\t%s\tsin-agente\n' "$role" "$req" >> "$DECISION"; fi
done < "$TMP/roles"

# ---- 5. Salida ----
printf 'gate\t1\tlevel=%s\tbase=%s\tfiles=%s\n' "$LEVEL" "$BASE_SHORT" "$NFILES"
awk -F'\t' '$1 == "file" { print $1 "\t" $2 "\t" $3 "\t" $4 }' "$CLASS"
for c in $CATS; do printf 'cat\t%s\t%s\n' "$c" "$(cnt_of "$c")"; done
cat "$DECISION"
printf 'rest\t%s\n' "$(awk -F'\t' '$1 == "rest" { n++ } END { print n + 0 }' "$CLASS")"
awk -F'\t' '$1 == "rest" { print "restfile\t" $3 }' "$CLASS"
exit 0
