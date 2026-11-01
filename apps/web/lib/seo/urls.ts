import { getPathname } from '@/i18n/navigation';
import { env } from '@/lib/env';

import type { pathnames } from '@/i18n/pathnames';
import type { Locale } from '@josecoded/types';

export type PathnameKey = keyof typeof pathnames;

/** Public origin without trailing slash. In a preview it is still production's: canonicals never point at the preview. */
export const siteUrl = () => env.client.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');

/** `true` unless this build is a preview: previews are noindex (header, robots.txt and meta). */
export const isIndexableSite = () => env.client.NEXT_PUBLIC_SITE_ENV !== 'preview';

// One source of URLs: next-intl's getPathname over the same `pathnames` the rewrites come from.
export function absoluteUrl(locale: Locale, pathname: PathnameKey, params?: Record<string, string>): string {
  const path = getPathname({ href: { pathname, params } as never, locale });
  return `${siteUrl()}${path === '/' ? '' : path}`;
}
