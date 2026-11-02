import { projects } from '@/content/projects';
import { getPathname } from '@/i18n/navigation';
import { hasOneLiner } from '@/lib/content/projects';
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
  // a case study joins the sitemap once its sentence is real (a sheet that still holds a marker is noindex)
  const cases = projects
    .filter((project) => hasOneLiner(project, 'es') && hasOneLiner(project, 'en'))
    .map((project) => {
      const urlFor = (locale: 'es' | 'en') =>
        `${siteUrl()}${getPathname({ href: { pathname: '/proyectos/[slug]', params: { slug: project.slug } }, locale })}`;
      return { urls: { es: urlFor('es'), en: urlFor('en') } };
    });
  return toSitemapEntries(sitemapPages(getSectionAvailability(), urlOf, cases));
}
