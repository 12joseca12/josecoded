import type { MetadataRoute } from "next";

import type { SiteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";

import { absoluteUrl, legalPriority, localePath, publicRoutes } from "./routes";

export interface BlogSitemapEntry {
  path: string;
  priority: number;
  lastModified?: string;
}

export function buildSitemap(
  site: SiteConfig,
  locales: readonly Locale[],
  hasProjects: boolean,
  hasContact: boolean,
  legalPaths: readonly string[] = [],
  blogEntries: readonly BlogSitemapEntry[] = [],
): MetadataRoute.Sitemap {
  const routes = publicRoutes.filter(
    (route) => (hasProjects || !route.needsProjects) && (hasContact || !route.needsContact),
  );
  const entries: { path: string; priority: number; lastModified?: string }[] = [
    ...routes.map(({ path, priority }) => ({ path, priority })),
    ...blogEntries,
    ...legalPaths.map((path) => ({ path, priority: legalPriority })),
  ];
  return locales.flatMap((locale) =>
    entries.map((entry) => ({
      url: absoluteUrl(site.origin, localePath(locale, entry.path)),
      priority: entry.priority,
      ...(entry.lastModified === undefined ? {} : { lastModified: entry.lastModified }),
    })),
  );
}
