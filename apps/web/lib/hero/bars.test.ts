import { expect, it } from 'vitest';

import { createBarWriter } from './bars';

it('fills the highlighted bar, keeps earlier ones full and later ones empty', () => {
  const ol = document.createElement('ol');
  ol.innerHTML = '<li></li><li></li><li></li>';
  const write = createBarWriter(ol);
  write(1, 0.4);
  expect([...ol.children].map((li) => (li as HTMLElement).style.getPropertyValue('--p'))).toEqual(['1.000', '0.400', '0.000']);
  write(0, 0.25);
  expect([...ol.children].map((li) => (li as HTMLElement).style.getPropertyValue('--p'))).toEqual(['0.250', '0.000', '0.000']);
});

it('does nothing without a list', () => {
  expect(() => createBarWriter(null)(0, 1)).not.toThrow();
});
