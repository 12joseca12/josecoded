import { getPathname } from '@/i18n/navigation';
import { robotsRules } from '@/lib/seo/robots';
import { isIndexableSite, siteUrl } from '@/lib/seo/urls';

import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// The private areas in each language, from the same `pathnames` as the routes. `/admin` is Spanish only and `/dev` is the
// UI catalogue (outside `pathnames`).
const PRIVATE_ROOTS = ['/area-clientes', '/perfil', '/auth/login'] as const;

function privatePaths(): string[] {
  const paths = new Set(['/admin', '/en/admin', '/dev', '/en/dev', '/auth', '/en/auth']);
  for (const root of PRIVATE_ROOTS) {
    for (const locale of ['es', 'en'] as const) {
      const path = getPathname({ href: root, locale });
      paths.add(root === '/auth/login' ? path.slice(0, path.lastIndexOf('/')) : path);
    }
  }
  return [...paths].sort();
}

export default function robots(): MetadataRoute.Robots {
  return robotsRules({ siteUrl: siteUrl(), indexable: isIndexableSite(), disallow: privatePaths() });
}
