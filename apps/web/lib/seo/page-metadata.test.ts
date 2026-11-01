import { describe, expect, it, vi } from 'vitest';

import { pageMetadata } from './page-metadata';

const mockEnv = vi.hoisted(() => ({
  client: { NEXT_PUBLIC_SITE_URL: 'https://josecoded.com', NEXT_PUBLIC_SITE_ENV: 'development' as string },
}));
vi.mock('@/lib/env', () => ({ env: mockEnv }));

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

  it('rejects titles that would pass 60 characters once the layout adds the suffix', () => {
    expect(() =>
      pageMetadata({ locale: 'es', pathname: '/', title: 'x'.repeat(49), description: 'd' }),
    ).toThrow(/48/);
    expect(() =>
      pageMetadata({ locale: 'es', pathname: '/', title: 'x'.repeat(48), description: 'd' }),
    ).not.toThrow();
  });

  it('refuses a {{DATO}} in the title or description only in a production build', () => {
    const page = { locale: 'es', pathname: '/servicios', title: 't', description: '{{DATO: descripción}}' } as const;
    mockEnv.client.NEXT_PUBLIC_SITE_ENV = 'preview';
    expect(() => pageMetadata(page)).not.toThrow();
    mockEnv.client.NEXT_PUBLIC_SITE_ENV = 'production';
    try {
      expect(() => pageMetadata(page)).toThrow(/DATO/);
      expect(() => pageMetadata({ ...page, title: '{{DATO: título}}', description: 'd' })).toThrow(/DATO/);
    } finally {
      mockEnv.client.NEXT_PUBLIC_SITE_ENV = 'development';
    }
  });

  it('points at the generated card of its section, or the default one', () => {
    const images = (pathname: '/servicios' | '/area-clientes', locale: 'es' | 'en') =>
      (pageMetadata({ locale, pathname, title: 't', description: 'd' }).openGraph as { images: string[] }).images;
    expect(images('/servicios', 'en')).toEqual(['https://josecoded.com/og/servicios-en.png']);
    expect(images('/area-clientes', 'es')).toEqual(['https://josecoded.com/og/default-es.png']);
  });

  it('noindex pages say so and keep following links', () => {
    const m = pageMetadata({ locale: 'es', pathname: '/chat', title: 'Chat', description: 'd', noindex: true });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(pageMetadata({ locale: 'es', pathname: '/chat', title: 'Chat', description: 'd' }).robots).toBeUndefined();
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
      siteName: 'josecoded',
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
