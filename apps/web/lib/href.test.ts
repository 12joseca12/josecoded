import { describe, expect, it } from 'vitest';

import { isInternalHref, toLinkTarget } from './href';

describe('isInternalHref', () => {
  it.each([
    ['/servicios', true],
    ['/servicios#packs', true],
    ['/', true],
    ['#main', false],
    ['https://cal.com/x', false],
    ['mailto:hola@josecoded.com', false],
    ['tel:+34600000000', false],
    ['//evil.example', false],
  ] as const)('%s -> %s', (href, expected) => {
    expect(isInternalHref(href)).toBe(expected);
  });
});

describe('toLinkTarget', () => {
  it('keeps a plain route as the pathname', () => {
    expect(toLinkTarget('/servicios')).toEqual({ pathname: '/servicios' });
    expect(toLinkTarget('/')).toEqual({ pathname: '/' });
  });

  it('splits query and hash', () => {
    expect(toLinkTarget('/servicios?pack=P2#packs')).toEqual({
      pathname: '/servicios',
      query: { pack: 'P2' },
      hash: 'packs',
    });
  });

  it('maps a dynamic route to its template with params', () => {
    expect(toLinkTarget('/proyectos/hazmefila')).toEqual({
      pathname: '/proyectos/[slug]',
      params: { slug: 'hazmefila' },
    });
    expect(toLinkTarget('/area-clientes/tareas/7#notas')).toEqual({
      pathname: '/area-clientes/tareas/[id]',
      params: { id: '7' },
      hash: 'notas',
    });
  });

  it('leaves an unknown path as it is (a 404 stays a 404)', () => {
    expect(toLinkTarget('/nope/x')).toEqual({ pathname: '/nope/x' });
  });
});
