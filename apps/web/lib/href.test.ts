import { describe, expect, it } from 'vitest';

import { pathnames } from '@/i18n/pathnames';

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
    expect(toLinkTarget('/proyectos/3cat')).toEqual({
      pathname: '/proyectos/[slug]',
      params: { slug: '3cat' },
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

  it('decodes dynamic params so next-intl does not encode them twice', () => {
    expect(toLinkTarget('/proyectos/caf%C3%A9')).toEqual({
      pathname: '/proyectos/[slug]',
      params: { slug: 'café' },
    });
    expect(toLinkTarget('/proyectos/café').params).toEqual({ slug: 'café' });
    expect(toLinkTarget('/proyectos/100%').params).toEqual({ slug: '100%' });
  });

  it('keeps repeated query keys as arrays', () => {
    expect(toLinkTarget('/blog?tag=a&tag=b&page=2').query).toEqual({ tag: ['a', 'b'], page: '2' });
  });

  it('next-intl serializes the decoded target once (no double encoding, repeated keys kept)', async () => {
    const { getPathname } = await import('next-intl/navigation').then((m) =>
      m.createNavigation({ locales: ['es', 'en'], defaultLocale: 'es', localePrefix: 'as-needed', pathnames }),
    );
    const target = toLinkTarget('/proyectos/café?tag=a&tag=b');
    const out = getPathname({ locale: 'en', href: target as never });
    expect(out).toContain('caf%C3%A9');
    expect(out).not.toContain('%25');
    expect(out).toContain('tag=a&tag=b');
  });
});
