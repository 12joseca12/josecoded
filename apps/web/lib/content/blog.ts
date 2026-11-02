import { blogIndexSchema } from '@/content/blog/schema';
import raw from '@/content/generated/blog-index.json';

import type { BlogIndex, BlogPostMeta } from '@/content/blog/schema';
import type { Locale } from '@josecoded/types';

export interface ListedPost extends BlogPostMeta {
  /** The guide exists only in the other language: the card says so («Solo en inglés»). */
  fallback: boolean;
}

/**
 * The guides of the listing for one language: one entry per slug, the page's language when it has it and the other
 * one marked as `fallback` when it does not (PANT P9), newest first. Pending guides (`{{DATO}}` in the frontmatter)
 * are listed only where pending texts show (development, previews), like every other pending block.
 */
export function listPosts(index: BlogIndex, locale: Locale, { pending }: { pending: boolean }): ListedPost[] {
  const bySlug = new Map<string, ListedPost>();
  for (const post of index.posts) {
    if (post.pending && !pending) continue;
    const own = post.locale === locale;
    if (own || !bySlug.has(post.slug)) bySlug.set(post.slug, { ...post, fallback: !own });
  }
  return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

/** One guide for the article page: the page's language, or the other one flagged as `fallback`. `undefined` is a 404. */
export function resolvePost(index: BlogIndex, locale: Locale, slug: string, { pending }: { pending: boolean }): ListedPost | undefined {
  return listPosts(index, locale, { pending }).find((post) => post.slug === slug);
}

/** Parsed once from the file written at prebuild (scripts/content-index.ts): a malformed index fails the build. */
const index = blogIndexSchema.parse(raw);

/** `pending`: `isPendingVisible()` of the page. */
export function blogPosts(locale: Locale, pending: boolean): ListedPost[] {
  return listPosts(index, locale, { pending });
}

export function blogPost(locale: Locale, slug: string, pending: boolean): ListedPost | undefined {
  return resolvePost(index, locale, slug, { pending });
}

/** Every slug the article route builds; a pending guide only where pending texts show (elsewhere it is a 404). */
export function blogSlugs(pending: boolean): string[] {
  return [...new Set(index.posts.filter((post) => pending || !post.pending).map((post) => post.slug))];
}
