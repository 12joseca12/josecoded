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
    expect(en('/negocios')).toBe('/business');
    expect(en('/empresas')).toBe('/companies');
    expect(en('/sobre-mi')).toBe('/about');
    expect(en('/contacto')).toBe('/contact');
    expect(en('/proyectos')).toBe('/projects');
    expect(en('/propuesta')).toBe('/proposal');
  });

  it('rewrites each English URL to its Spanish folder, with subpaths', () => {
    expect(rewrites).toContainEqual({ source: '/en/business', destination: '/en/negocios' });
    expect(rewrites).toContainEqual({
      source: '/en/business/:path+',
      destination: '/en/negocios/:path+',
    });
    expect(rewrites).toContainEqual({ source: '/en/about', destination: '/en/sobre-mi' });
    expect(rewrites).toContainEqual({
      source: '/en/legal/notice/:path+',
      destination: '/en/legal/aviso-legal/:path+',
    });
  });

  it('redirects the untranslated English variant (no duplicate URLs)', () => {
    expect(redirects).toContainEqual({
      source: '/en/negocios',
      destination: '/en/business',
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: '/en/negocios/:path+',
      destination: '/en/business/:path+',
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
      source: '/en/negocios/',
      destination: '/en/business',
      permanent: true,
    });
    expect(redirects.findIndex((r) => r.source === '/:path+/')).toBe(redirects.length - 1);
  });

  it('rewrites the Spanish default locale without prefix, excluding en, api, _next and files', () => {
    expect(rewrites).toContainEqual({ source: '/', destination: '/es' });
    const catchAll = rewrites.find((r) => r.destination === '/es/:path');
    expect(catchAll?.source).toBe('/:path((?!en(?:/|$)|api|_next|.*\\..*).*)');
  });
});
