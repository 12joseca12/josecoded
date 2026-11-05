import type { MetadataRoute } from "next";

import { contact } from "@/config/contact";
import { features } from "@/config/features";
import { site } from "@/config/site";
import { hasPublishedProjects, listLegal, listPosts } from "@/content";
import { publishedLocales } from "@/i18n/config";
import { blogSitemapEntries } from "@/lib/blog/posts";
import { hasLiveChannel } from "@/lib/contact/channels";
import { indexedLegalPaths } from "@/lib/legal/pages";
import { buildSitemap } from "@/lib/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap(
    site,
    publishedLocales,
    hasPublishedProjects(),
    hasLiveChannel(contact),
    indexedLegalPaths(listLegal()),
    features.blog ? blogSitemapEntries(listPosts()) : [],
  );
}
