import { describe, expect, it } from 'vitest';

import { initialShellState, shellReducer } from './shell-reducer';

import type { ShellAction, ShellState } from './shell-reducer';

const run = (actions: ShellAction[], from: ShellState = initialShellState) =>
  actions.reduce(shellReducer, from);

describe('shellReducer', () => {
  it('starts with everything closed', () => {
    expect(initialShellState).toEqual({ palette: false, menu: false, openCell: null });
  });

  it('opens and toggles the palette', () => {
    expect(run([{ type: 'palette/open' }]).palette).toBe(true);
    expect(run([{ type: 'palette/toggle' }]).palette).toBe(true);
    expect(run([{ type: 'palette/toggle' }, { type: 'palette/toggle' }]).palette).toBe(false);
    expect(run([{ type: 'palette/open' }, { type: 'palette/close' }]).palette).toBe(false);
  });

  it('never has the palette and the menu open together', () => {
    const withMenu = run([{ type: 'menu/open' }, { type: 'palette/open' }]);
    expect(withMenu).toMatchObject({ palette: true, menu: false });
    const withPalette = run([{ type: 'palette/open' }, { type: 'menu/toggle' }]);
    expect(withPalette).toMatchObject({ palette: false, menu: true });
  });

  it('opening a cell closes the menu and keeps the palette independent', () => {
    expect(run([{ type: 'menu/open' }, { type: 'cell/open', id: 'vias' }])).toEqual({
      palette: false,
      menu: false,
      openCell: 'vias',
    });
    expect(run([{ type: 'cell/open', id: 'vias' }, { type: 'palette/open' }])).toEqual({
      palette: true,
      menu: false,
      openCell: 'vias',
    });
    expect(run([{ type: 'cell/open', id: 'a' }, { type: 'cell/open', id: 'b' }]).openCell).toBe('b');
  });

  it('Esc closes only the topmost layer: menu, then palette, then cell', () => {
    const all: ShellState = { palette: true, menu: true, openCell: 'vias' };
    const afterOne = shellReducer(all, { type: 'escape' });
    expect(afterOne).toEqual({ palette: true, menu: false, openCell: 'vias' });
    const afterTwo = shellReducer(afterOne, { type: 'escape' });
    expect(afterTwo).toEqual({ palette: false, menu: false, openCell: 'vias' });
    const afterThree = shellReducer(afterTwo, { type: 'escape' });
    expect(afterThree).toEqual(initialShellState);
  });

  it('returns the same object when nothing changes (no needless re-render)', () => {
    expect(shellReducer(initialShellState, { type: 'escape' })).toBe(initialShellState);
    expect(shellReducer(initialShellState, { type: 'cell/close' })).toBe(initialShellState);
    expect(shellReducer(initialShellState, { type: 'menu/close' })).toBe(initialShellState);
    expect(shellReducer(initialShellState, { type: 'palette/close' })).toBe(initialShellState);
  });
});
