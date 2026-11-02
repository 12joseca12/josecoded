import { describe, expect, it } from 'vitest';

import { buildFeed, escapeXml } from './feed';

const base = {
  locale: 'es' as const,
  title: 'josecoded · Guías',
  description: 'Guías técnicas.',
  link: 'https://josecoded.com/blog',
  self: 'https://josecoded.com/feed.xml',
};
const item = { title: 'Scroll & snap <bien>', url: 'https://josecoded.com/blog/scroll', description: 'Con "código".', date: '2026-09-20', tags: ['css'] };

describe('buildFeed', () => {
  it('is RSS 2.0 with absolute links, a self link and the language', () => {
    const xml = buildFeed({ ...base, items: [item] });
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(true);
    expect(xml).toContain('<language>es</language>');
    expect(xml).toContain('<atom:link href="https://josecoded.com/feed.xml" rel="self" type="application/rss+xml"/>');
    expect(xml).toContain('<link>https://josecoded.com/blog/scroll</link>');
    expect(xml).toContain('<guid isPermaLink="true">https://josecoded.com/blog/scroll</guid>');
  });

  it('escapes the text of titles and descriptions', () => {
    const xml = buildFeed({ ...base, items: [item] });
    expect(xml).toContain('<title>Scroll &amp; snap &lt;bien&gt;</title>');
    expect(xml).toContain('<description>Con &quot;código&quot;.</description>');
    expect(escapeXml("a'b")).toBe('a&apos;b');
  });

  it('dates items in RFC 822 and stamps the channel with the newest one, never with now', () => {
    const xml = buildFeed({ ...base, items: [item, { ...item, url: 'https://josecoded.com/blog/b', date: '2026-10-01' }] });
    expect(xml).toContain('<pubDate>Sun, 20 Sep 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('<lastBuildDate>Thu, 01 Oct 2026 00:00:00 GMT</lastBuildDate>');
  });

  it('is still a valid channel with no items', () => {
    const xml = buildFeed({ ...base, items: [] });
    expect(xml).not.toContain('<item>');
    expect(xml).not.toContain('lastBuildDate');
    expect(xml).toContain('</channel>');
  });
});
