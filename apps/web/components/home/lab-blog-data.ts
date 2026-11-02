import { blogPosts } from '@/lib/content/blog';

import type { SectionAvailability } from '@/lib/content/sections';
import type { Locale } from '@josecoded/types';

export interface HomePost {
  slug: string;
  title: string;
  description: string;
  /** ISO date, `2026-09-20`. */
  date: string;
}

export interface HomeDemo {
  slug: string;
  name: string;
  description: string;
}

export type LabBlogVariant = 'both' | 'lab' | 'blog';

/**
 * Which cells the Lab/Blog scene has (home-v7 README §4.4): both sections give the demo plus two
 * guides; only Lab gives the demo plus two more demos; only Blog gives the latest article plus two
 * guides; neither gives no scene at all. `getSectionAvailability()` decides (Lab and Blog are
 * always on outside production).
 */
export function labBlogVariant({ lab, blog }: SectionAvailability): LabBlogVariant | null {
  if (lab && blog) return 'both';
  if (lab) return 'lab';
  if (blog) return 'blog';
  return null;
}

/**
 * Real guides and demos for the scene, newest first. The guides come from the blog index (only `kind: guide`, in the
 * page's language or the other one when it has no translation); the demos arrive with the lab (4.5). Where one is
 * missing the scene shows `{{DATO}}` placeholders in development and previews only.
 */
export function getHomeLabBlogContent(locale: Locale, pending: boolean): { posts: readonly HomePost[]; demos: readonly HomeDemo[] } {
  const posts = blogPosts(locale, pending)
    .filter((post) => post.kind === 'guide')
    .map(({ slug, title, description, date }) => ({ slug, title, description, date }));
  return { posts, demos: [] };
}
