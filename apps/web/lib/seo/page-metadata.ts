import { isPendingDato } from '@/lib/content/dato';
import { env } from '@/lib/env';

import { ogImageFor } from './og-keys';
import { absoluteUrl, siteUrl } from './urls';

import type { PathnameKey } from './urls';
import type { Locale } from '@josecoded/types';
import type { Metadata } from 'next';

// The layout adds the ` · josecoded` suffix (12 characters): the title a page hands in must leave room
// for it so that the rendered one stays under ~60 (SEO/GEO analysis 2026-10-31, §2.0.1).
export const MAX_TITLE = 48;
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
  /** Path or absolute URL. Default: the generated card of the page (`/og/<key>-<locale>.png`, scripts/og.ts). */
  ogImage?: string;
  /** `true` for pages that must not be indexed but may be followed (`/chat`, auth). */
  noindex?: boolean;
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
  ogImage = ogImageFor(locale, pathname),
  noindex = false,
}: PageMetadataInput): Metadata {
  if (title.length > MAX_TITLE) {
    throw new Error(`pageMetadata: title is ${title.length} characters, the limit is ${MAX_TITLE}`);
  }
  // A pending text is fine while building a preview or locally, but it must never reach production
  // (the production build is the gate that makes Jose supply the {{DATO}}).
  if (env.client.NEXT_PUBLIC_SITE_ENV === 'production' && (isPendingDato(title) || isPendingDato(description))) {
    throw new Error(`pageMetadata: ${pathname} still has a {{DATO}} in its title or description`);
  }
  const canonical = absoluteUrl(locale, pathname, params);
  const es = absoluteUrl('es', pathname, params);

  return {
    title,
    description,
    ...(noindex && { robots: { index: false, follow: true } }),
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
      siteName: 'josecoded',
      images: [ogImage.startsWith('http') ? ogImage : `${siteUrl()}${ogImage}`],
    },
    twitter: { card: 'summary_large_image' },
  };
}
