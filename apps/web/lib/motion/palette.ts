export interface PaletteCommand {
  id: string;
  group: string;
  label: string;
  hint?: string;
  /** Extra words that find the command (already lower case and without accents is not required). */
  keywords: readonly string[];
}

/** Lower case, no accents: «Sánchez» is «sanchez». */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** The commands that match `query` in their label, hint or keywords, in their original order. */
export function filter<T extends PaletteCommand>(commands: readonly T[], query: string): T[] {
  const needle = normalize(query.trim());
  if (needle === '') return [...commands];
  return commands.filter((command) => normalize([command.label, command.hint ?? '', ...command.keywords].join(' ')).includes(needle));
}

export interface PaletteState {
  query: string;
  /** Index in the filtered list. */
  index: number;
}

export type PaletteAction = { type: 'query'; query: string } | { type: 'key'; key: string } | { type: 'hover'; index: number };

/**
 * The palette's state machine: typing resets the selection to the first match; ↑ and ↓ move it and
 * wrap around; hovering selects. Enter and Esc belong to the caller (open the selected command,
 * close the dialog).
 */
export function reduce(state: PaletteState, action: PaletteAction, commands: readonly PaletteCommand[]): PaletteState {
  const count = filter(commands, state.query).length;
  if (action.type === 'query') return { query: action.query, index: 0 };
  if (action.type === 'hover') return count === 0 ? state : { ...state, index: Math.min(action.index, count - 1) };
  if (count === 0) return state;
  if (action.key === 'ArrowDown') return { ...state, index: (state.index + 1) % count };
  if (action.key === 'ArrowUp') return { ...state, index: (state.index - 1 + count) % count };
  return state;
}
