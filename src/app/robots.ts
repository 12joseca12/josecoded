import type { MetadataRoute } from "next";

import { site } from "@/config/site";
import { publishedLocales } from "@/i18n/config";
import { buildRobots } from "@/lib/seo/robots";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(site, publishedLocales);
}
