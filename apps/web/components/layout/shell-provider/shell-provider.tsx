'use client';

import { createContext, useCallback, useContext, useMemo, useReducer, useState } from 'react';

import { initialShellState, shellReducer } from './shell-reducer';

import type { ShellState } from './shell-reducer';
import type { ReactNode } from 'react';

export interface ShellApi extends ShellState {
  /** True while a command palette is mounted. Its trigger and the ⌘K shortcut stay inert otherwise. */
  paletteMounted: boolean;
  /**
   * The palette (task 2.16) calls this in an effect when it mounts and returns the cleanup:
   * `useEffect(() => registerPalette(), [registerPalette])`. This is the only switch that turns the
   * trigger and the shortcut on.
   */
  registerPalette: () => () => void;
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
  const [palettes, setPalettes] = useState(0);
  const registerPalette = useCallback(() => {
    setPalettes((count) => count + 1);
    return () => setPalettes((count) => count - 1);
  }, []);

  // `dispatch` never changes, so the actions are created once: effects that call them do not
  // re-subscribe every time the state moves
  const actions = useMemo<Omit<ShellApi, keyof ShellState | 'paletteMounted' | 'registerPalette'>>(
    () => ({
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
    [],
  );
  const api = useMemo<ShellApi>(
    () => ({ ...state, ...actions, paletteMounted: palettes > 0, registerPalette }),
    [state, actions, palettes, registerPalette],
  );

  return <ShellContext value={api}>{children}</ShellContext>;
}

export function useShell(): ShellApi {
  const value = useContext(ShellContext);
  if (!value) throw new Error('useShell must be used inside <ShellProvider>');
  return value;
}
