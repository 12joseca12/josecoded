import type { BlogCategory, BlogMeta, BlogService } from "@/content/schemas";
import { blogCategories } from "@/content/schemas";
import type { ContentEntry } from "@/content/types";

export type PostEntry = ContentEntry<BlogMeta>;

export const postsPerPage = 4;

export const blogPath = "/blog";

export const servicePaths: Record<BlogService, string> = {
  hub: "/servicios",
  freelance: "/servicios/freelance",
  "a-medida": "/servicios/a-medida",
};

export function postPath(slug: string): string {
  return `${blogPath}/${slug}`;
}

export function categoryPath(category: BlogCategory): string {
  return `${blogPath}/tema/${category}`;
}

export function isBlogCategory(value: string): value is BlogCategory {
  return (blogCategories as readonly string[]).includes(value);
}

export function categoriesWithPosts(posts: readonly PostEntry[]): BlogCategory[] {
  return blogCategories.filter((category) => posts.some((post) => post.meta.category === category));
}

export function postsInCategory(posts: readonly PostEntry[], category: BlogCategory): PostEntry[] {
  return posts.filter((post) => post.meta.category === category);
}

export function sortPosts(posts: readonly PostEntry[]): PostEntry[] {
  return [...posts].sort(
    (a, b) =>
      b.meta.date.localeCompare(a.meta.date) ||
      (a.meta.order ?? Number.MAX_SAFE_INTEGER) - (b.meta.order ?? Number.MAX_SAFE_INTEGER) ||
      a.slug.localeCompare(b.slug),
  );
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export function parsePage(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1;
  if (typeof raw !== "string" || !/^[1-9]\d{0,3}$/.test(raw)) return null;
  return Number(raw);
}

export interface Page<T> {
  items: T[];
  page: number;
  total: number;
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  size = postsPerPage,
): Page<T> | null {
  const total = Math.max(1, Math.ceil(items.length / size));
  if (page > total) return null;
  return { items: items.slice((page - 1) * size, page * size), page, total };
}

export function pagePath(base: string, page: number): string {
  return page === 1 ? base : `${base}?pagina=${page}`;
}

export function relatedPosts(posts: readonly PostEntry[], post: PostEntry): PostEntry[] {
  return post.meta.relatedPosts.flatMap((slug) => posts.filter((entry) => entry.slug === slug));
}

export function splitTitle(title: string): { head: string; accent?: string } {
  const index = title.indexOf(": ");
  if (index === -1) return { head: title };
  return { head: title.slice(0, index + 1), accent: title.slice(index + 2) };
}

export function latestUpdate(posts: readonly PostEntry[]): string | undefined {
  return posts
    .map((post) => post.meta.updated)
    .sort()
    .at(-1);
}

export const blogPriorities = { index: 0.7, category: 0.5, post: 0.6 } as const;

export function blogSitemapEntries(posts: readonly PostEntry[]) {
  if (posts.length === 0) return [];
  return [
    { path: blogPath, priority: blogPriorities.index, lastModified: latestUpdate(posts) },
    ...categoriesWithPosts(posts).map((category) => ({
      path: categoryPath(category),
      priority: blogPriorities.category,
      lastModified: latestUpdate(postsInCategory(posts, category)),
    })),
    ...posts.map((post) => ({
      path: postPath(post.slug),
      priority: blogPriorities.post,
      lastModified: post.meta.updated,
    })),
  ];
}
