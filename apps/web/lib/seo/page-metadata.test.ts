import { describe, expect, it, vi } from 'vitest';

import { pageMetadata } from './page-metadata';

vi.mock('@/lib/env', () => ({
  env: { client: { NEXT_PUBLIC_SITE_URL: 'https://josecoded.com' } },
}));

describe('pageMetadata', () => {
  it('es canonical without prefix, en under /en, alternates with x-default', () => {
    const m = pageMetadata({
      locale: 'es',
      pathname: '/servicios',
      title: 'Servicios y precios',
      description: 'd',
    });
    expect(m.alternates?.canonical).toBe('https://josecoded.com/servicios');
    expect(m.alternates?.languages).toEqual({
      es: 'https://josecoded.com/servicios',
      en: 'https://josecoded.com/en/services',
      'x-default': 'https://josecoded.com/servicios',
    });
  });

  it('the English page is canonical to itself and points back at Spanish', () => {
    const m = pageMetadata({ locale: 'en', pathname: '/servicios', title: 't', description: 'd' });
    expect(m.alternates?.canonical).toBe('https://josecoded.com/en/services');
    expect(m.alternates?.languages).toMatchObject({
      es: 'https://josecoded.com/servicios',
      'x-default': 'https://josecoded.com/servicios',
    });
  });

  it('area routes are localized too', () => {
    expect(
      pageMetadata({
        locale: 'en',
        pathname: '/area-clientes/tareas',
        title: 't',
        description: 'd',
      }).alternates?.canonical,
    ).toBe('https://josecoded.com/en/client-area/tasks');
  });

  it('the home has no trailing slash in either language', () => {
    const m = pageMetadata({ locale: 'es', pathname: '/', title: 't', description: 'd' });
    expect(m.alternates?.languages).toEqual({
      es: 'https://josecoded.com',
      en: 'https://josecoded.com/en',
      'x-default': 'https://josecoded.com',
    });
  });

  it('no alternates when the page has no translation', () => {
    const m = pageMetadata({
      locale: 'es',
      pathname: '/blog/[slug]',
      params: { slug: 'solo-es' },
      title: 't',
      description: 'd',
      hasTranslation: false,
    });
    expect(m.alternates?.canonical).toBe('https://josecoded.com/blog/solo-es');
    expect(m.alternates?.languages).toBeUndefined();
  });

  it('rejects long titles', () => {
    expect(() =>
      pageMetadata({ locale: 'es', pathname: '/', title: 'x'.repeat(61), description: 'd' }),
    ).toThrow(/60/);
  });

  it('carries title, description and the Open Graph card of its own locale', () => {
    const m = pageMetadata({
      locale: 'en',
      pathname: '/lab',
      title: 'Lab',
      description: 'Small demos',
      ogImage: '/og/lab.png',
    });
    expect(m.title).toBe('Lab');
    expect(m.description).toBe('Small demos');
    expect(m.openGraph).toMatchObject({
      url: 'https://josecoded.com/en/lab',
      locale: 'en_US',
      images: ['https://josecoded.com/og/lab.png'],
    });
  });
});

describe('dynamic pages', () => {
  it.each([
    ['es', '/proyectos/[slug]', 'https://josecoded.com/proyectos/hazmefila'],
    ['en', '/proyectos/[slug]', 'https://josecoded.com/en/projects/hazmefila'],
    ['en', '/blog/[slug]', 'https://josecoded.com/en/blog/hazmefila'],
    ['en', '/area-clientes/tareas/[id]', 'https://josecoded.com/en/client-area/tasks/hazmefila'],
  ] as const)('%s %s', (locale, pathname, canonical) => {
    const m = pageMetadata({
      locale,
      pathname,
      params: { slug: 'hazmefila', id: 'hazmefila' },
      title: 't',
      description: 'd',
    });
    expect(m.alternates?.canonical).toBe(canonical);
  });
});
