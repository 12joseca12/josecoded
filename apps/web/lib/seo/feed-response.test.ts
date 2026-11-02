// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  blog: true,
  posts: [] as unknown[],
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}`,
}));
vi.mock('@/lib/content/sections', () => ({ getSectionAvailability: () => ({ lab: false, blog: mocks.blog }) }));
vi.mock('@/lib/content/blog', () => ({ blogPosts: () => mocks.posts }));
vi.mock('./urls', () => ({
  absoluteUrl: (locale: string, path: string, params?: { slug: string }) =>
    `https://josecoded.com${locale === 'en' ? '/en' : ''}${path === '/' ? '' : path.replace('[slug]', params?.slug ?? '')}`,
}));

import { feedResponse } from './feed-response';

const post = (over: Record<string, unknown>) => ({ slug: 'a', title: 'A', description: 'Desc', date: '2026-09-20', tags: [], fallback: false, ...over });

beforeEach(() => {
  mocks.blog = true;
  mocks.posts = [];
});

describe('feedResponse', () => {
  it('is 404 while the blog is not available', async () => {
    mocks.blog = false;
    expect((await feedResponse('es')).status).toBe(404);
  });

  it('serves RSS with absolute guide URLs and leaves out the other language and pending texts', async () => {
    mocks.posts = [post({ slug: 'uno' }), post({ slug: 'dos', fallback: true }), post({ slug: 'tres', title: '{{DATO: titulo}}' })];
    const res = await feedResponse('en');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    const xml = await res.text();
    expect(xml).toContain('<link>https://josecoded.com/en/blog/uno</link>');
    expect(xml).toContain('href="https://josecoded.com/en/feed.xml"');
    expect(xml).not.toContain('/dos<');
    expect(xml).not.toContain('{{DATO');
  });
});
