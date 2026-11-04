import type { MetadataRoute } from "next";

import type { SiteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";

import { absoluteUrl, localePath, publicRoutes } from "./routes";

export function buildSitemap(site: SiteConfig, locales: readonly Locale[]): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    publicRoutes.map((route) => ({
      url: absoluteUrl(site.origin, localePath(locale, route.path)),
      priority: route.priority,
    })),
  );
}
