import type { Locale } from "@/i18n/config";
import { personId } from "@/lib/seo/jsonld";
import { absoluteUrl, localePath } from "@/lib/seo/routes";
import {
  type BlogJsonLd,
  blogJsonLdSchema,
  type BlogPostingJsonLd,
  blogPostingSchema,
  type ItemListJsonLd,
  itemListSchema,
} from "@/types/seo";

import { blogPath, postPath } from "./posts";

export function blogId(origin: string, locale: Locale): string {
  return `${absoluteUrl(origin, localePath(locale, blogPath))}#blog`;
}

export function buildBlog(
  origin: string,
  locale: Locale,
  copy: { name: string; description: string },
): BlogJsonLd {
  return blogJsonLdSchema.parse({
    "@type": "Blog",
    "@id": blogId(origin, locale),
    url: absoluteUrl(origin, localePath(locale, blogPath)),
    name: copy.name,
    description: copy.description,
    inLanguage: locale,
    publisher: { "@id": personId(origin) },
    author: { "@id": personId(origin) },
  });
}

export function buildPostList(
  origin: string,
  locale: Locale,
  id: string,
  posts: readonly { slug: string; title: string }[],
): ItemListJsonLd {
  return itemListSchema.parse({
    "@type": "ItemList",
    "@id": `${id}-list`,
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(origin, localePath(locale, postPath(post.slug))),
      name: post.title,
    })),
  });
}

export interface BlogPostingInput {
  slug: string;
  title: string;
  description: string;
  published: string;
  modified: string;
  section: string;
  words: number;
}

export function buildBlogPosting(
  origin: string,
  locale: Locale,
  post: BlogPostingInput,
): BlogPostingJsonLd {
  const url = absoluteUrl(origin, localePath(locale, postPath(post.slug)));
  return blogPostingSchema.parse({
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    headline: post.title,
    description: post.description,
    inLanguage: locale,
    datePublished: post.published,
    dateModified: post.modified,
    articleSection: post.section,
    wordCount: post.words,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@id": personId(origin) },
    publisher: { "@id": personId(origin) },
    isPartOf: { "@id": blogId(origin, locale) },
  });
}
