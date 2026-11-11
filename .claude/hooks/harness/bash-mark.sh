#!/usr/bin/env bash
# Generado por /harness (claude-config). No editar: se sobrescribe en /harness update.
# PreToolUse (Bash): marca el instante previo al comando; bash-track.sh apunta lo que cambie despues.
# Nunca bloquea ni emite decision (la guardia es guard-bash.sh).
. "$(dirname "${BASH_SOURCE[0]}")/lib.sh" 2>/dev/null || exit 0
harness_read_input
sd="$(state_dir)" || exit 0
touch "$sd/bash-start" 2>/dev/null
exit 0
