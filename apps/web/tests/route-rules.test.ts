import { match } from 'next/dist/compiled/path-to-regexp';
import { describe, expect, it } from 'vitest';

import { pathnames } from '../i18n/pathnames';
import { buildLocaleRules } from '../i18n/route-rules';

const { rewrites, redirects } = buildLocaleRules(pathnames);

describe('translated English slugs (pathnames)', () => {
  it('translates the public slugs', () => {
    const en = (key: keyof typeof pathnames) => {
      const value = pathnames[key];
      return typeof value === 'string' ? value : value.en;
    };
    expect(en('/servicios')).toBe('/services');
    expect(en('/area-clientes')).toBe('/client-area');
    expect(en('/area-clientes/pack/ampliar')).toBe('/client-area/plan/upgrade');
    expect(en('/auth/registro')).toBe('/auth/sign-up');
    expect(en('/perfil')).toBe('/profile');
    expect(en('/sobre-mi')).toBe('/about');
    expect(en('/contacto')).toBe('/contact');
    expect(en('/proyectos')).toBe('/projects');
    expect(en('/propuesta')).toBe('/proposal');
  });

  it('rewrites each English URL to its Spanish folder, with subpaths', () => {
    expect(rewrites).toContainEqual({ source: '/en/services', destination: '/en/servicios' });
    expect(rewrites).toContainEqual({
      source: '/en/services/:path+',
      destination: '/en/servicios/:path+',
    });
    expect(rewrites).toContainEqual({
      source: '/en/client-area/plan/upgrade',
      destination: '/en/area-clientes/pack/ampliar',
    });
    expect(rewrites).toContainEqual({ source: '/en/about', destination: '/en/sobre-mi' });
    expect(rewrites).toContainEqual({
      source: '/en/legal/notice/:path+',
      destination: '/en/legal/aviso-legal/:path+',
    });
  });

  it('redirects the untranslated English variant (no duplicate URLs)', () => {
    expect(redirects).toContainEqual({
      source: '/en/servicios',
      destination: '/en/services',
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: '/en/servicios/:path+',
      destination: '/en/services/:path+',
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: '/en/area-clientes/tareas',
      destination: '/en/client-area/tasks',
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: '/en/sobre-mi',
      destination: '/en/about',
      permanent: true,
    });
  });

  it('redirects /es/... to the canonical Spanish URL without prefix', () => {
    expect(redirects).toContainEqual({ source: '/es', destination: '/', permanent: true });
    expect(redirects).toContainEqual({
      source: '/es/:path+',
      destination: '/:path+',
      permanent: true,
    });
  });

  it('emits nothing for slugs that are the same in both languages', () => {
    const same = Object.entries(pathnames).filter(([, v]) => typeof v === 'string');
    expect(same.length).toBeGreaterThan(0);
    for (const [key] of same) {
      expect(rewrites.some((r) => r.source === `/en${key}`)).toBe(false);
      expect(redirects.some((r) => r.source === `/en${key}`)).toBe(false);
    }
  });

  it('puts longer paths first so /legal/notice wins over a shorter prefix', () => {
    const exact = rewrites
      .map((r) => r.source)
      .filter((s) => s.startsWith('/en/') && !s.includes(':'));
    const lengths = exact.map((s) => s.length);
    expect(lengths.length).toBeGreaterThan(1);
    // sorted by the translated path length, descending
    expect([...lengths].sort((a, b) => b - a)).toEqual(lengths);
  });

  it('never leaves an optional :path* (OpenNext on workerd does not expand it when empty)', () => {
    for (const rule of [...rewrites, ...redirects]) {
      expect(rule.source).not.toContain(':path*');
      expect(rule.destination).not.toContain(':path*');
    }
  });

  it('sends trailing-slash variants straight to the canonical URL, specific rules first', () => {
    expect(redirects).toContainEqual({ source: '/es/', destination: '/', permanent: true });
    expect(redirects).toContainEqual({
      source: '/en/servicios/',
      destination: '/en/services',
      permanent: true,
    });
    expect(redirects.findIndex((r) => r.source === '/:path+/')).toBe(redirects.length - 1);
  });

  it('rewrites the Spanish default locale at any depth, excluding en, api, _next and files', () => {
    expect(rewrites).toContainEqual({ source: '/', destination: '/es' });
    const one = rewrites.find((r) => r.destination === '/es/:first');
    const deep = rewrites.find((r) => r.destination === '/es/:first/:rest+');
    expect(one).toBeDefined();
    expect(deep).toBeDefined();
    // a destination param must never carry slashes (that is what produced the 500)
    expect(rewrites.some((r) => r.destination === '/es/:path')).toBe(false);
  });

  describe('retired pages (P1 /negocios and P4 /empresas)', () => {
    const redirectFor = (path: string) =>
      redirects.find((rule) => match(rule.source)(path) !== false);

    it.each([
      ['/negocios', '/servicios#packs'],
      ['/negocios/', '/servicios#packs'],
      ['/negocios/x', '/servicios#packs'],
      ['/es/negocios', '/servicios#packs'],
      ['/empresas', '/servicios#por-hora'],
      ['/en/business', '/en/services#packs'],
      ['/en/negocios', '/en/services#packs'],
      ['/en/companies', '/en/services#hourly'],
      ['/en/empresas', '/en/services#hourly'],
    ])('%s answers 301 to %s in one hop', (path, destination) => {
      const rule = redirectFor(path);
      expect(rule).toMatchObject({ destination, statusCode: 301 });
      expect(rule).not.toHaveProperty('permanent');
    });

    it('no longer has a page nor a translated slug of its own', () => {
      for (const gone of ['/negocios', '/empresas']) expect(pathnames).not.toHaveProperty(gone);
      expect(
        rewrites.some((r) => r.source.includes('business') || r.source.includes('companies')),
      ).toBe(false);
    });

    it.each([
      '/auth',
      '/auth/',
      '/es/auth',
      '/es/auth/',
    ])('%s reaches /auth/login in one hop', (path) => {
      expect(redirectFor(path)).toMatchObject({ destination: '/auth/login' });
    });

    it.each(['/en/auth', '/en/auth/'])('%s reaches /en/auth/login in one hop', (path) => {
      expect(redirectFor(path)).toMatchObject({ destination: '/en/auth/login' });
    });

    it('sends the bare /auth to the login', () => {
      expect(redirectFor('/auth')).toMatchObject({ destination: '/auth/login' });
      expect(redirectFor('/en/auth')).toMatchObject({ destination: '/en/auth/login' });
    });
  });

  describe('dynamic templates', () => {
    it('lists the dynamic screens with their English equivalents', () => {
      expect(pathnames['/proyectos/[slug]']).toEqual({
        es: '/proyectos/[slug]',
        en: '/projects/[slug]',
      });
      expect(pathnames['/area-clientes/tareas/[id]'].en).toBe('/client-area/tasks/[id]');
      expect(pathnames['/blog/[slug]']).toBe('/blog/[slug]');
      expect(pathnames['/lab/[slug]']).toBe('/lab/[slug]');
    });

    it('emits no rule with brackets: the translated parent covers every child', () => {
      for (const rule of [...rewrites, ...redirects]) {
        expect(rule.source).not.toMatch(/\[(slug|id)\]/);
        expect(rule.destination).not.toMatch(/\[(slug|id)\]/);
      }
    });

    it.each([
      ['/en/projects/hazmefila', '/en/proyectos/:path+'],
      ['/en/client-area/tasks/7', '/en/area-clientes/tareas/:path+'],
    ])('%s rewrites to %s', (path, destination) => {
      expect(rewrites.find((rule) => match(rule.source)(path) !== false)?.destination).toBe(
        destination,
      );
    });

    it('leaves /en/lab/x to the page itself (same slug in both languages)', () => {
      expect(rewrites.some((rule) => match(rule.source)('/en/lab/x') !== false)).toBe(false);
    });

    it('redirects the untranslated English child to the translated one', () => {
      const rule = redirects.find((r) => match(r.source)('/en/proyectos/hazmefila') !== false);
      expect(rule).toMatchObject({ destination: '/en/projects/:path+', permanent: true });
    });
  });

  describe('which rewrite a URL reaches (same matcher Next uses)', () => {
    const rewriteFor = (path: string) =>
      rewrites.find((rule) => match(rule.source)(path) !== false)?.destination;

    it.each([
      ['/', '/es'],
      ['/servicios', '/es/:first'],
      ['/servicios/x', '/es/:first/:rest+'],
      ['/a/b/c', '/es/:first/:rest+'],
      ['/legal/aviso-legal', '/es/:first/:rest+'],
      ['/entrada', '/es/:first'],
      ['/hero', '/es/:first'],
      ['/art', '/es/:first'],
      ['/og', '/es/:first'],
      ['/hero/', '/es/:first'],
      ['/en/services', '/en/servicios'],
      ['/en/client-area/tasks/7', '/en/area-clientes/tareas/:path+'],
    ])('%s -> %s', (path, destination) => {
      expect(rewriteFor(path)).toBe(destination);
    });

    // the result of a rewrite must not match a second one: `next dev` chains them (/ -> /es -> /es/es)
    it.each(['/es', '/es/servicios', '/es/a/b'])('%s is not rewritten again', (path) => {
      expect(rewriteFor(path)).toBeUndefined();
    });

    // English URLs must never be pushed under /es (that served the Spanish 404 on /en/nope)
    it.each([
      '/en',
      '/en/nope',
      '/en/a/b',
      '/api/x',
      '/api',
      '/_next/static/x',
      '/favicon.ico',
      '/foo.txt',
      '/hero/poster.webp',
      '/art/glyph-phone.avif',
      '/og/home.png',
    ])('%s is left alone', (path) => {
      const reached = rewriteFor(path);
      expect(reached === undefined || reached.startsWith('/en/'), `${path} -> ${reached}`).toBe(
        true,
      );
    });
  });
});
