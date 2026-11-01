import { expect, it } from 'vitest';

import { safeNext } from './next-param';

it.each([
  ['/area-clientes', '/area-clientes'],
  ['/admin/radar?x=1', '/admin/radar?x=1'],
  ['/en/client-area#top', '/en/client-area#top'],
  ['https://evil.com', '/'],
  ['//evil.com', '/'],
  ['/\\evil.com', '/'],
  ['/%5Cevil.com', '/%5Cevil.com'],
  ['javascript:alert(1)', '/'],
  ['/a\nb', '/'],
  ['', '/'],
  [undefined, '/'],
  [null, '/'],
])('%s -> %s', (input, output) => {
  expect(safeNext(input)).toBe(output);
});

it('uses the given fallback', () => {
  expect(safeNext('https://evil.com', '/area-clientes')).toBe('/area-clientes');
});

it('refuses very long values', () => {
  expect(safeNext(`/${'a'.repeat(600)}`)).toBe('/');
});
