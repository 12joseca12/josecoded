import { afterEach, expect, it, vi } from 'vitest';

import { openCell } from './expand-cell';

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.style.overflow = '';
});

const markup =
  '<header id="h"><a href="/">x</a></header><main><article id="c" tabindex="-1"><button id="open">Ampliar</button><button id="close">Cerrar</button><a href="/y">y</a></article><p id="p">other</p></main>';

it('opens as a modal dialog, inerts the rest, traps focus and returns it on close', () => {
  document.body.innerHTML = markup;
  const cell = document.getElementById('c')!;
  const opener = document.getElementById('open') as HTMLButtonElement;
  opener.focus();
  const onClose = vi.fn();
  const h = openCell(cell, { opener, onClose });
  expect(cell.getAttribute('role')).toBe('dialog');
  expect(cell.getAttribute('aria-modal')).toBe('true');
  expect(cell.dataset.open).toBe('true');
  expect(document.documentElement.style.overflow).toBe('hidden');
  expect(document.getElementById('h')!.hasAttribute('inert')).toBe(true);
  expect(document.getElementById('p')!.closest('[inert]')).toBeTruthy();
  expect(cell.closest('[inert]')).toBeNull();

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(cell.getAttribute('role')).toBeNull();
  expect(cell.dataset.open).toBeUndefined();
  expect(document.documentElement.style.overflow).toBe('');
  expect(document.getElementById('h')!.hasAttribute('inert')).toBe(false);
  expect(document.activeElement).toBe(opener);
  expect(onClose).toHaveBeenCalledOnce();
  h.destroy();
});

it('leaves Esc to a dialog that is open above it (the palette)', () => {
  document.body.innerHTML = `${markup}<dialog id="d" open></dialog>`;
  const cell = document.getElementById('c')!;
  const h = openCell(cell, { opener: document.getElementById('open') });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(cell.getAttribute('role')).toBe('dialog');
  h.destroy();
  expect(cell.getAttribute('role')).toBeNull();
});

it('closes from the veil and shows it only while open', () => {
  document.body.innerHTML = `${markup}<div id="s" hidden></div>`;
  const cell = document.getElementById('c')!;
  const scrim = document.getElementById('s')!;
  const h = openCell(cell, { scrim });
  expect(scrim.hidden).toBe(false);
  scrim.click();
  expect(scrim.hidden).toBe(true);
  expect(h.isOpen()).toBe(false);
});
