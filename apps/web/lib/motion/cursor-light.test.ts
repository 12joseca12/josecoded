import { expect, it } from 'vitest';

import { attachCursorLight } from './cursor-light';

it('writes the pointer position relative to the cell under it, once per bento', () => {
  document.body.innerHTML = '<div id="b"><article data-cell id="c"><p id="p">x</p></article></div><article data-cell id="out"></article>';
  const bento = document.getElementById('b')!;
  const cell = document.getElementById('c')!;
  cell.getBoundingClientRect = () => ({ left: 100, top: 50 }) as DOMRect;
  const detach = attachCursorLight(bento);

  document.getElementById('p')!.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 130, clientY: 90 }));
  expect(cell.style.getPropertyValue('--mx')).toBe('30px');
  expect(cell.style.getPropertyValue('--my')).toBe('40px');

  detach();
  document.getElementById('p')!.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 500, clientY: 500 }));
  expect(cell.style.getPropertyValue('--mx')).toBe('30px');
});
