import { describe, expect, it } from 'vitest';

import { sitemapPages, toSitemapEntries } from './sitemap';

const urlOf = (locale: 'es' | 'en', page: string) => `https://josecoded.com${locale === 'en' ? '/en' : ''}${page === '/' ? '' : page}`;

describe('sitemap', () => {
  it('leaves /blog and /lab out while their sections are off', () => {
    const urls = toSitemapEntries(sitemapPages({ blog: false, lab: false }, urlOf)).map((e) => e.url);
    expect(urls).toContain('https://josecoded.com');
    expect(urls).toContain('https://josecoded.com/en/servicios');
    expect(urls.some((u) => u.includes('/blog') || u.includes('/lab'))).toBe(false);
  });

  it('lists them when they exist, each language pointing at the other and at x-default', () => {
    const entries = toSitemapEntries(sitemapPages({ blog: true, lab: true }, urlOf));
    const blog = entries.find((e) => e.url === 'https://josecoded.com/en/blog');
    expect(blog?.alternates?.languages).toEqual({
      es: 'https://josecoded.com/blog',
      en: 'https://josecoded.com/en/blog',
      'x-default': 'https://josecoded.com/blog',
    });
    expect(entries.some((e) => e.url.endsWith('/lab'))).toBe(true);
  });

  it('never lists private or noindex routes', () => {
    const urls = toSitemapEntries(sitemapPages({ blog: true, lab: true }, urlOf)).map((e) => e.url).join(' ');
    for (const hidden of ['/auth', '/perfil', '/area-clientes', '/admin', '/chat', '/dev']) expect(urls).not.toContain(hidden);
  });

  it('carries a real lastModified only when the page has one; a one-language page has no alternates', () => {
    const entries = toSitemapEntries(
      sitemapPages({ blog: false, lab: false }, urlOf, [{ urls: { es: 'https://josecoded.com/blog/solo-es' }, lastModified: '2026-10-01' }]),
    );
    expect(entries.find((e) => e.url.endsWith('/servicios'))?.lastModified).toBeUndefined();
    const solo = entries.find((e) => e.url.endsWith('solo-es'));
    expect(solo).toEqual({ url: 'https://josecoded.com/blog/solo-es', lastModified: '2026-10-01' });
  });
});
