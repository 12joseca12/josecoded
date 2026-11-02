import { describe, expect, it } from 'vitest';

import { listPosts } from './blog';

import type { BlogPostMeta } from '@/content/blog/schema';

const post = (slug: string, locale: 'es' | 'en', date: string, extra: Partial<BlogPostMeta> = {}): BlogPostMeta => ({
  slug,
  locale,
  date,
  title: slug,
  description: 'd',
  kind: 'guide',
  tags: [],
  readingMinutes: 5,
  pending: false,
  hasTranslation: false,
  ...extra,
});

const index = {
  posts: [
    post('both', 'es', '2026-10-01', { hasTranslation: true }),
    post('both', 'en', '2026-10-01', { hasTranslation: true }),
    post('only-en', 'en', '2026-10-09'),
    post('draft', 'es', '2026-10-20', { pending: true }),
  ],
};

describe('listPosts', () => {
  it('lists one entry per slug in the language of the page, newest first, and flags the fallback', () => {
    expect(listPosts(index, 'es', { pending: true }).map((p) => [p.slug, p.locale, p.fallback])).toEqual([
      ['draft', 'es', false],
      ['only-en', 'en', true],
      ['both', 'es', false],
    ]);
    expect(listPosts(index, 'en', { pending: true }).map((p) => [p.slug, p.locale, p.fallback])).toEqual([
      ['draft', 'es', true],
      ['only-en', 'en', false],
      ['both', 'en', false],
    ]);
  });

  it('leaves out the pending ones when they must not show', () => {
    expect(listPosts(index, 'es', { pending: false }).map((p) => p.slug)).toEqual(['only-en', 'both']);
  });
});
