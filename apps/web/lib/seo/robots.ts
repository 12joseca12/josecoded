// robots.txt as data. AI crawlers are named on purpose (the goal is to be cited, SEO/GEO analysis §4.8, §5.3): note that
// `Google-Extended` governs Gemini training, NOT AI Overviews (those use Googlebot), so nobody should block it believing
// it hides the site from answers. A crawler with its own group ignores the `*` group, so every group repeats the
// disallow list. A preview disallows everything and advertises no sitemap.
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
] as const;

export interface RobotsInput {
  siteUrl: string;
  indexable: boolean;
  /** Path prefixes that must not be crawled (auth, profile, client area, admin, dev), both languages. */
  disallow: string[];
}

export function robotsRules({ siteUrl, indexable, disallow }: RobotsInput) {
  if (!indexable) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
