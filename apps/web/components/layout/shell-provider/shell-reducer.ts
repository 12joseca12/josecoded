/** What is open in the shell (working-agreements §17.2): palette, mobile menu and the expanded cell. */
export interface ShellState {
  palette: boolean;
  menu: boolean;
  /** Id of the expanded bento cell, or `null`. */
  openCell: string | null;
}

export type ShellAction =
  | { type: 'palette/open' }
  | { type: 'palette/close' }
  | { type: 'palette/toggle' }
  | { type: 'menu/open' }
  | { type: 'menu/close' }
  | { type: 'menu/toggle' }
  | { type: 'cell/open'; id: string }
  | { type: 'cell/close' }
  /** Esc: closes the topmost layer only (menu, then palette, then cell). */
  | { type: 'escape' };

export const initialShellState: ShellState = { palette: false, menu: false, openCell: null };

/**
 * The palette and the menu never coexist (each takes the other's place: the menu closes when focus
 * or a tap lands outside it). A cell may stay open under the palette, because choosing a command
 * closes the cell before jumping; opening a cell closes the menu.
 */
export function shellReducer(state: ShellState, action: ShellAction): ShellState {
  switch (action.type) {
    case 'palette/open':
      return state.palette && !state.menu ? state : { ...state, palette: true, menu: false };
    case 'palette/close':
      return state.palette ? { ...state, palette: false } : state;
    case 'palette/toggle':
      return state.palette ? { ...state, palette: false } : { ...state, palette: true, menu: false };
    case 'menu/open':
      return state.menu && !state.palette ? state : { ...state, menu: true, palette: false };
    case 'menu/close':
      return state.menu ? { ...state, menu: false } : state;
    case 'menu/toggle':
      return state.menu ? { ...state, menu: false } : { ...state, menu: true, palette: false };
    case 'cell/open':
      return state.openCell === action.id && !state.menu
        ? state
        : { ...state, openCell: action.id, menu: false };
    case 'cell/close':
      return state.openCell === null ? state : { ...state, openCell: null };
    case 'escape':
      if (state.menu) return { ...state, menu: false };
      if (state.palette) return { ...state, palette: false };
      if (state.openCell !== null) return { ...state, openCell: null };
      return state;
  }
}
