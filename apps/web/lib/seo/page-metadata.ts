import { getPathname } from '@/i18n/navigation';
import { env } from '@/lib/env';

import type { pathnames } from '@/i18n/pathnames';
import type { Locale } from '@josecoded/types';
import type { Metadata } from 'next';

type PathnameKey = keyof typeof pathnames;
const MAX_TITLE = 60;
const OPEN_GRAPH_LOCALE: Record<Locale, string> = { es: 'es_ES', en: 'en_US' };

export interface PageMetadataInput {
  locale: Locale;
  /** Key of `pathnames` (Spanish canonical path or dynamic template): `/servicios`, `/proyectos/[slug]`. */
  pathname: PathnameKey;
  /** Values of the template's dynamic segments: `{ slug: 'hazmefila' }`. */
  params?: Record<string, string>;
  title: string;
  description: string;
  /** `false` for content that exists in one language only: no `hreflang` alternates. */
  hasTranslation?: boolean;
  /** Path (`/og/lab.png`) or absolute URL. */
  ogImage?: string;
}

const siteUrl = () => env.client.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

// One source of URLs: next-intl's getPathname over the same `pathnames` the rewrites come from.
function absoluteUrl(locale: Locale, pathname: PathnameKey, params?: Record<string, string>): string {
  const path = getPathname({ href: { pathname, params } as never, locale });
  return `${siteUrl()}${path === '/' ? '' : path}`;
}

/**
 * The only way a page declares its metadata: canonical for its own language, `hreflang`
 * alternates es/en plus `x-default` (Spanish) and an Open Graph card (spec §8, DT §1.4).
 */
export function pageMetadata({
  locale,
  pathname,
  params,
  title,
  description,
  hasTranslation = true,
  ogImage,
}: PageMetadataInput): Metadata {
  if (title.length > MAX_TITLE) {
    throw new Error(`pageMetadata: title is ${title.length} characters, the limit is ${MAX_TITLE}`);
  }
  const canonical = absoluteUrl(locale, pathname, params);
  const es = absoluteUrl('es', pathname, params);

  return {
    title,
    description,
    alternates: {
      canonical,
      ...(hasTranslation && {
        languages: { es, en: absoluteUrl('en', pathname, params), 'x-default': es },
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
