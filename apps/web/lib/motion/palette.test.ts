import { expect, it } from 'vitest';

import { filter, normalize, reduce } from './palette';

const cmds = [
  { id: 'projects', group: 'go', label: 'Proyectos', keywords: ['apps', 'webs'] },
  { id: 'price', group: 'go', label: 'Packs', hint: 'desde 900 €', keywords: ['precio'] },
  { id: 'wa', group: 'act', label: 'Escribir por WhatsApp', keywords: ['whatsapp'] },
];

it('filters without accents and across keywords', () => {
  expect(normalize('Sánchez')).toBe('sanchez');
  expect(filter(cmds, 'PRECIO').map((c) => c.id)).toEqual(['price']);
  expect(filter(cmds, '').length).toBe(3);
  expect(filter(cmds, 'proyécto').map((c) => c.id)).toEqual(['projects']); // the query is normalized too
  expect(filter(cmds, 'proyecto').map((c) => c.id)).toEqual(['projects']);
  expect(filter(cmds, '900').map((c) => c.id)).toEqual(['price']);
});

it('keyboard moves the selection and wraps', () => {
  let s = { query: '', index: 0 };
  s = reduce(s, { type: 'key', key: 'ArrowUp' }, cmds);
  expect(s.index).toBe(2);
  s = reduce(s, { type: 'key', key: 'ArrowDown' }, cmds);
  expect(s.index).toBe(0);
});

it('typing resets the selection, hovering selects, and an empty result keeps the state', () => {
  let s = { query: '', index: 2 };
  s = reduce(s, { type: 'query', query: 'a' }, cmds);
  expect(s).toEqual({ query: 'a', index: 0 });
  s = reduce(s, { type: 'hover', index: 99 }, cmds);
  expect(s.index).toBe(filter(cmds, 'a').length - 1);
  const none = reduce({ query: 'zzz', index: 0 }, { type: 'key', key: 'ArrowDown' }, cmds);
  expect(none).toEqual({ query: 'zzz', index: 0 });
});
