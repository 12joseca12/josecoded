// RSS 2.0 of the blog (block B06). A pure builder, like `llms.ts`: `feed-response.ts` feeds it the guides and the texts.
// Every URL is absolute (RSS readers have no base); the dates come from the guides, so the same index gives the same
// feed byte for byte (no "now" inside).
import type { Locale } from '@josecoded/types';

export interface FeedItem {
  title: string;
  /** Absolute URL of the guide. */
  url: string;
  description: string;
  /** Publication day, `2026-09-20`. */
  date: string;
  tags: readonly string[];
}

export interface FeedInput {
  locale: Locale;
  title: string;
  description: string;
  /** Absolute URL of the blog index. */
  link: string;
  /** Absolute URL of this feed. */
  self: string;
  items: readonly FeedItem[];
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
export const escapeXml = (text: string): string => text.replace(/[&<>"']/g, (char) => ESCAPES[char]!);

/** RFC 822 date at midnight UTC. */
const rfc822 = (day: string): string => new Date(`${day}T00:00:00Z`).toUTCString();

export function buildFeed({ locale, title, description, link, self, items }: FeedInput): string {
  const newest = items.map((item) => item.date).sort().at(-1);
  const entries = items.map((item) =>
    [
      '    <item>',
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${escapeXml(item.url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(item.url)}</guid>`,
      `      <pubDate>${rfc822(item.date)}</pubDate>`,
      `      <description>${escapeXml(item.description)}</description>`,
      ...item.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
      '    </item>',
    ].join('\n'),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${escapeXml(link)}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <language>${locale}</language>`,
    ...(newest ? [`    <lastBuildDate>${rfc822(newest)}</lastBuildDate>`] : []),
    `    <atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml"/>`,
    ...entries,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
