import { getTranslations } from 'next-intl/server';

import { blogPosts } from '@/lib/content/blog';
import { hasDato } from '@/lib/content/dato';
import { getSectionAvailability } from '@/lib/content/sections';

import { buildFeed } from './feed';
import { absoluteUrl } from './urls';

import type { Locale } from '@josecoded/types';

/**
 * `/feed.xml` (Spanish) and `/en/feed.xml`: the guides written in that language, newest first. While the blog is not
 * available (fewer than three real guides in production) there is no feed: 404, like `/blog`.
 */
export async function feedResponse(locale: Locale): Promise<Response> {
  if (!getSectionAvailability().blog) return new Response('Not found', { status: 404 });
  const [blog, site] = await Promise.all([getTranslations({ locale, namespace: 'blog' }), getTranslations({ locale, namespace: 'site' })]);
  const items = blogPosts(locale, false)
    .filter((post) => !post.fallback && hasDato(post.title) && hasDato(post.description))
    .map((post) => ({
      title: post.title,
      url: absoluteUrl(locale, '/blog/[slug]', { slug: post.slug }),
      description: post.description,
      date: post.date,
      tags: post.tags,
    }));
  const xml = buildFeed({
    locale,
    title: `${site('name')} · ${blog('title')}`,
    description: blog('meta.description'),
    link: absoluteUrl(locale, '/blog'),
    self: `${absoluteUrl(locale, '/')}/feed.xml`,
    items,
  });
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
