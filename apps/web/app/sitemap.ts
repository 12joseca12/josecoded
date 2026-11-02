import { LEGAL_DOCS, legalContent, legalStrings } from '@/content/legal';
import { projects } from '@/content/projects';
import { getPathname } from '@/i18n/navigation';
import { isPendingDato } from '@/lib/content/dato';
import { hasOneLiner } from '@/lib/content/projects';
import { getSectionAvailability } from '@/lib/content/sections';
import { env } from '@/lib/env';
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
  // a case study joins the sitemap once its sentence is real (a sheet that still holds a marker is noindex)
  const cases = projects
    .filter((project) => hasOneLiner(project, 'es') && hasOneLiner(project, 'en'))
    .map((project) => {
      const urlFor = (locale: 'es' | 'en') =>
        `${siteUrl()}${getPathname({ href: { pathname: '/proyectos/[slug]', params: { slug: project.slug } }, locale })}`;
      return { urls: { es: urlFor('es'), en: urlFor('en') } };
    });
  // legal texts that still hold a marker answer 404 in production (3.6): they are not listed either
  const legalReady =
    env.client.NEXT_PUBLIC_SITE_ENV !== 'production' ||
    LEGAL_DOCS.every((doc) => (['es', 'en'] as const).every((locale) => !legalStrings(legalContent(doc, locale)).some(isPendingDato)));
  const pages = sitemapPages(getSectionAvailability(), urlOf, cases).filter(
    (page) => legalReady || !Object.values(page.urls).some((url) => url.includes('/legal/')),
  );
  return toSitemapEntries(pages);
}
