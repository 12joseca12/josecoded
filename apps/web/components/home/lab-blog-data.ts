import type { SectionAvailability } from '@/lib/content/sections';

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
 * Real articles and demos for the scene, newest first. The content loaders arrive with the blog
 * (4.2) and the lab (4.5); until then there is nothing real, and the scene shows `{{DATO}}`
 * placeholders in development and previews only (production has neither section enabled yet).
 */
export function getHomeLabBlogContent(): { posts: readonly HomePost[]; demos: readonly HomeDemo[] } {
  return { posts: [], demos: [] };
}
