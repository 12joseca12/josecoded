import type { MetadataRoute } from "next";

import type { SiteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";

import { absoluteUrl, localePath, publicRoutes } from "./routes";

export function buildSitemap(
  site: SiteConfig,
  locales: readonly Locale[],
  hasProjects: boolean,
): MetadataRoute.Sitemap {
  const routes = publicRoutes.filter((route) => hasProjects || !route.needsProjects);
  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: absoluteUrl(site.origin, localePath(locale, route.path)),
      priority: route.priority,
    })),
  );
}
