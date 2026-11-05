import type { BlogCategory } from "@/content/schemas";
import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { localePath } from "@/lib/seo/routes";
import type { CategoryTabItem, PaginationData, PostTeaserData } from "@/types/blog";

import {
  blogPath,
  categoriesWithPosts,
  categoryPath,
  type Page,
  pagePath,
  type PostEntry,
  postPath,
  readingMinutes,
} from "./posts";

export type Translate = (key: MessageKey) => string;

export const categoryKey = (category: BlogCategory, field: string) =>
  `blog.categories.${category}.${field}` as MessageKey;

export function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(iso),
  );
}

export function readingLabel(t: Translate, words: number): string {
  return t("blog.teaser.reading").replace("{minutes}", String(readingMinutes(words)));
}

export function toTeaser(t: Translate, locale: Locale, post: PostEntry): PostTeaserData {
  return {
    href: localePath(locale, postPath(post.slug)),
    title: post.meta.title,
    description: post.meta.description,
    categoryLabel: t(categoryKey(post.meta.category, "label")),
    kind: post.meta.kind,
    kindLabel: post.meta.kind === "resource" ? t("blog.teaser.resource") : null,
    updated: post.meta.updated,
    updatedLabel: t("blog.teaser.updated").replace("{date}", formatDate(locale, post.meta.updated)),
    readingLabel: readingLabel(t, post.words),
  };
}

export function buildTabs(
  t: Translate,
  locale: Locale,
  posts: readonly PostEntry[],
  current: BlogCategory | null,
): CategoryTabItem[] {
  return [
    {
      id: "all",
      label: t("blog.tabs.all"),
      href: localePath(locale, blogPath),
      current: current === null,
    },
    ...categoriesWithPosts(posts).map((category) => ({
      id: category,
      label: t(categoryKey(category, "label")),
      href: localePath(locale, categoryPath(category)),
      current: current === category,
    })),
  ];
}

export function buildPagination(
  t: Translate,
  locale: Locale,
  basePath: string,
  page: Pick<Page<unknown>, "page" | "total">,
): PaginationData | null {
  if (page.total <= 1) return null;
  const href = (target: number) => localePath(locale, pagePath(basePath, target));
  return {
    label: t("blog.pagination.label"),
    status: t("blog.pagination.status")
      .replace("{page}", String(page.page))
      .replace("{total}", String(page.total)),
    previous:
      page.page > 1 ? { href: href(page.page - 1), label: t("blog.pagination.previous") } : null,
    next:
      page.page < page.total
        ? { href: href(page.page + 1), label: t("blog.pagination.next") }
        : null,
    previousLabel: t("blog.pagination.previous"),
    nextLabel: t("blog.pagination.next"),
  };
}
