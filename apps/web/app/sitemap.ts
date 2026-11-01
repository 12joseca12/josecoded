import { getPathname } from '@/i18n/navigation';
import { getSectionAvailability } from '@/lib/content/sections';
import { sitemapPages, toSitemapEntries } from '@/lib/seo/sitemap';
import { isIndexableSite, siteUrl } from '@/lib/seo/urls';

import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // a preview lists nothing: its robots.txt disallows everything
  if (!isIndexableSite()) return [];
  const urlOf = (locale: 'es' | 'en', pathname: Parameters<typeof getPathname>[0]['href']) => {
    const path = getPathname({ href: pathname, locale });
    return `${siteUrl()}${path === '/' ? '' : path}`;
  };
  return toSitemapEntries(sitemapPages(getSectionAvailability(), urlOf));
}
