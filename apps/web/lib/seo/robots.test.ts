import { describe, expect, it } from 'vitest';

import { AI_CRAWLERS, robotsRules } from './robots';

const disallow = ['/admin', '/auth'];

describe('robotsRules', () => {
  it('allows the AI crawlers by name, each with the private disallow list, and points at the sitemap', () => {
    const { rules, sitemap } = robotsRules({ siteUrl: 'https://josecoded.com', indexable: true, disallow });
    expect(sitemap).toBe('https://josecoded.com/sitemap.xml');
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'OAI-SearchBot']) {
      expect(AI_CRAWLERS).toContain(bot);
    }
    const names = rules.map((rule) => rule.userAgent);
    expect(names).toEqual(['*', ...AI_CRAWLERS]);
    for (const rule of rules) expect(rule).toMatchObject({ allow: '/', disallow });
  });

  it('a preview disallows everything and lists no sitemap', () => {
    expect(robotsRules({ siteUrl: 'https://josecoded.com', indexable: false, disallow })).toEqual({
      rules: [{ userAgent: '*', disallow: '/' }],
    });
  });
});
