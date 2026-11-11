#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# SessionStart (solo en la nube): imprime Pendientes y Siguiente paso de ESTADO.md.
# En el Mac ya lo hace el hook global de claude-config; aquí se evita duplicarlo.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
f="${CLAUDE_PROJECT_DIR:-$PWD}/ESTADO.md"
[ -f "$f" ] || exit 0
echo "Estado del proyecto (ESTADO.md, solo Pendientes y Siguiente paso):"
awk '/^## Pendientes/{p=1;print;next} /^## Siguiente paso/{p=1;print;next} /^## /{p=0} p' "$f"
exit 0
