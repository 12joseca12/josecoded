import { pathnames } from '@/i18n/pathnames';
import { env } from '@/lib/env';

import type { Locale } from '@josecoded/types';
import type { Metadata } from 'next';

const MAX_TITLE = 60;
const OPEN_GRAPH_LOCALE: Record<Locale, string> = { es: 'es_ES', en: 'en_US' };

export interface PageMetadataInput {
  locale: Locale;
  /** Canonical Spanish path of the page, with children: `/servicios`, `/proyectos/hazmefila`. */
  pathname: string;
  title: string;
  description: string;
  /** `false` for content that exists in one language only: no `hreflang` alternates. */
  hasTranslation?: boolean;
  /** Path (`/og/lab.png`) or absolute URL. */
  ogImage?: string;
}

/** Translates a Spanish path to its URL path in `locale`; unknown prefixes stay as they are. */
export function localizePath(pathname: string, locale: Locale): string {
  if (locale === 'es' || pathname === '/') return pathname;
  // the longest translated prefix wins: /area-clientes/pack/ampliar before /area-clientes
  const prefix = Object.keys(pathnames)
    .filter((key) => key !== '/' && (pathname === key || pathname.startsWith(`${key}/`)))
    .sort((a, b) => b.length - a.length)[0] as keyof typeof pathnames | undefined;
  if (!prefix) return pathname;
  const translated: string | { es: string; en: string } = pathnames[prefix];
  return `${typeof translated === 'string' ? translated : translated.en}${pathname.slice(prefix.length)}`;
}

const siteUrl = () => env.client.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

function absoluteUrl(locale: Locale, pathname: string): string {
  const site = siteUrl();
  const path = localizePath(pathname, locale);
  const tail = path === '/' ? '' : path;
  return `${site}${locale === 'en' ? '/en' : ''}${tail}`;
}

/**
 * The only way a page declares its metadata: canonical for its own language, `hreflang`
 * alternates es/en plus `x-default` (Spanish) and an Open Graph card (spec §8, DT §1.4).
 */
export function pageMetadata({
  locale,
  pathname,
  title,
  description,
  hasTranslation = true,
  ogImage,
}: PageMetadataInput): Metadata {
  if (title.length > MAX_TITLE) {
    throw new Error(`pageMetadata: title is ${title.length} characters, the limit is ${MAX_TITLE}`);
  }
  const canonical = absoluteUrl(locale, pathname);
  const es = absoluteUrl('es', pathname);

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(hasTranslation && {
        languages: { es, en: absoluteUrl('en', pathname), 'x-default': es },
      }),
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      locale: OPEN_GRAPH_LOCALE[locale],
      ...(ogImage && {
        images: [ogImage.startsWith('http') ? ogImage : `${siteUrl()}${ogImage}`],
      }),
    },
  };
}
