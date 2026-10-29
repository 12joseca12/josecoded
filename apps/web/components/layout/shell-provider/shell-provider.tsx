'use client';

import { createContext, useContext, useMemo, useReducer } from 'react';

import { initialShellState, shellReducer } from './shell-reducer';

import type { ShellState } from './shell-reducer';
import type { ReactNode } from 'react';

export interface ShellApi extends ShellState {
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  openCellById: (id: string) => void;
  closeCell: () => void;
  /** Esc: closes the topmost layer (menu, palette, cell). */
  escape: () => void;
}

const ShellContext = createContext<ShellApi | null>(null);

/**
 * The only shared client state of the shell. Everything else is URL, Server Components or local
 * state; `lib/motion/` keeps its own internal state.
 */
export function ShellProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(shellReducer, initialShellState);

  const api = useMemo<ShellApi>(
    () => ({
      ...state,
      openPalette: () => dispatch({ type: 'palette/open' }),
      closePalette: () => dispatch({ type: 'palette/close' }),
      togglePalette: () => dispatch({ type: 'palette/toggle' }),
      openMenu: () => dispatch({ type: 'menu/open' }),
      closeMenu: () => dispatch({ type: 'menu/close' }),
      toggleMenu: () => dispatch({ type: 'menu/toggle' }),
      openCellById: (id) => dispatch({ type: 'cell/open', id }),
      closeCell: () => dispatch({ type: 'cell/close' }),
      escape: () => dispatch({ type: 'escape' }),
    }),
    [state],
  );

  return <ShellContext value={api}>{children}</ShellContext>;
}

export function useShell(): ShellApi {
  const value = useContext(ShellContext);
  if (!value) throw new Error('useShell must be used inside <ShellProvider>');
  return value;
}
