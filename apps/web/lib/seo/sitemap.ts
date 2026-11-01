import type { SectionAvailability } from '@/lib/content/sections';
import type { Locale } from '@josecoded/types';

// What the sitemap lists, as data (the `app/sitemap.ts` route only feeds it the environment). Static pages of the plan
// (UX §2): the commercial ones, the personal ones and the legal ones. Never listed: auth, profile, client area, admin,
// chat (noindex), `/dev`, and Lab/Blog while `getSectionAvailability()` has them off (they answer 404 then).
// Dynamic pages (case studies, guides, demos) join through `extra` as their tasks (3.4, 4.2, 4.5) provide them,
// each with its real `lastModified`.

export type StaticPage =
  | '/'
  | '/servicios'
  | '/partners'
  | '/proyectos'
  | '/sobre-mi'
  | '/contacto'
  | '/propuesta'
  | '/legal/aviso-legal'
  | '/legal/privacidad'
  | '/legal/cookies'
  | '/blog'
  | '/lab';

export const STATIC_PAGES: readonly StaticPage[] = [
  '/',
  '/servicios',
  '/partners',
  '/proyectos',
  '/sobre-mi',
  '/contacto',
  '/propuesta',
  '/legal/aviso-legal',
  '/legal/privacidad',
  '/legal/cookies',
  '/blog',
  '/lab',
];

export interface SitemapPage {
  /** Absolute URL per language; a page with one language only has one key. */
  urls: Partial<Record<Locale, string>>;
  /** ISO date of the real last content change; omitted when unknown (a build date would be a lie). */
  lastModified?: string;
}

/** Pages that exist for the current availability of the optional sections. */
export function sitemapPages(
  availability: SectionAvailability,
  urlOf: (locale: Locale, pathname: StaticPage) => string,
  extra: SitemapPage[] = [],
): SitemapPage[] {
  const pages = STATIC_PAGES.filter((page) => (page === '/blog' ? availability.blog : page === '/lab' ? availability.lab : true));
  return [
    ...pages.map((page) => ({ urls: { es: urlOf('es', page), en: urlOf('en', page) } })),
    ...extra,
  ];
}

/** Entries in Next's `MetadataRoute.Sitemap` shape: one per language, each pointing at the other (`xhtml:link`). */
export function toSitemapEntries(pages: SitemapPage[]) {
  return pages.flatMap((page) => {
    const languages = page.urls;
    const alternates = Object.keys(languages).length > 1 ? { languages: { ...languages, 'x-default': languages.es ?? Object.values(languages)[0]! } } : undefined;
    return (Object.values(languages) as string[]).map((url) => ({
      url,
      ...(page.lastModified && { lastModified: page.lastModified }),
      ...(alternates && { alternates }),
    }));
  });
}
