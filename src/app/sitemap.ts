import type { MetadataRoute } from "next";

import { site } from "@/config/site";
import { publishedLocales } from "@/i18n/config";
import { buildSitemap } from "@/lib/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(site, publishedLocales);
}
