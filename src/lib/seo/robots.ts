import type { MetadataRoute } from "next";

import type { SiteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";

import { privatePrefixes, rootPrivatePrefixes } from "./routes";

export const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Googlebot",
  "Bingbot",
  "CCBot",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "Meta-ExternalAgent",
  "DuckAssistBot",
  "cohere-ai",
  "Bytespider",
] as const;

export function disallowedPaths(locales: readonly Locale[]): string[] {
  return [
    ...privatePrefixes,
    ...rootPrivatePrefixes,
    ...locales.flatMap((locale) => privatePrefixes.map((prefix) => `/${locale}${prefix}`)),
  ];
}

export function buildRobots(site: SiteConfig, locales: readonly Locale[]): MetadataRoute.Robots {
  if (!site.indexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  const disallow = disallowedPaths(locales);
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: [...aiCrawlers], allow: "/", disallow },
    ],
    sitemap: `${site.origin}/sitemap.xml`,
  };
}
