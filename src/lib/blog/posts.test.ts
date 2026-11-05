import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { productionOrigin, resolveSite } from "@/config/site";
import { readContent } from "@/content/loader";
import type { BlogMeta } from "@/content/schemas";
import { blogCategories } from "@/content/schemas";
import { buildSitemap } from "@/lib/seo/sitemap";

import {
  blogSitemapEntries,
  categoriesWithPosts,
  isBlogCategory,
  pagePath,
  paginate,
  parsePage,
  type PostEntry,
  postsInCategory,
  readingMinutes,
  relatedPosts,
  sortPosts,
  splitTitle,
} from "./posts";

const root = join(import.meta.dirname, "../../..");

function entry(slug: string, overrides: Partial<BlogMeta> = {}, words = 900): PostEntry {
  return {
    slug,
    words,
    headings: [],
    load: () => Promise.reject(new Error("not loaded")),
    meta: {
      title: slug,
      slug,
      description: "d",
      date: "2026-11-05",
      updated: "2026-11-05",
      category: "precios",
      kind: "article",
      tags: [],
      draft: false,
      faq: [],
      relatedService: "a-medida",
      relatedPosts: [],
      ...overrides,
    },
  };
}

describe("parsePage", () => {
  it("defaults to the first page and rejects anything that is not a positive integer", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBeNull();
    expect(parsePage("-1")).toBeNull();
    expect(parsePage("1.5")).toBeNull();
    expect(parsePage("abc")).toBeNull();
    expect(parsePage(["1", "2"])).toBeNull();
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 9 }, (_, index) => index);

  it("slices by page and reports the total", () => {
    expect(paginate(items, 1, 4)).toEqual({ items: [0, 1, 2, 3], page: 1, total: 3 });
    expect(paginate(items, 3, 4)).toEqual({ items: [8], page: 3, total: 3 });
  });

  it("returns null past the last page and keeps one page when empty", () => {
    expect(paginate(items, 4, 4)).toBeNull();
    expect(paginate([], 1, 4)).toEqual({ items: [], page: 1, total: 1 });
  });
});

describe("pagePath", () => {
  it("leaves the first page without a query", () => {
    expect(pagePath("/blog", 1)).toBe("/blog");
    expect(pagePath("/blog", 2)).toBe("/blog?pagina=2");
  });
});

describe("sortPosts", () => {
  it("sorts by newest date, then by order, then by slug", () => {
    const sorted = sortPosts([
      entry("b", { order: 2 }),
      entry("a", { order: 1 }),
      entry("new", { date: "2026-12-01" }),
      entry("z"),
    ]).map((post) => post.slug);
    expect(sorted).toEqual(["new", "a", "b", "z"]);
  });
});

describe("categories", () => {
  const posts = [entry("a", { category: "react-native" }), entry("b", { category: "precios" })];

  it("lists only categories with posts, in the plan order", () => {
    expect(categoriesWithPosts(posts)).toEqual(["precios", "react-native"]);
    expect(postsInCategory(posts, "precios").map((post) => post.slug)).toEqual(["b"]);
  });

  it("recognises category slugs", () => {
    expect(isBlogCategory("accesibilidad-ia")).toBe(true);
    expect(isBlogCategory("ia")).toBe(false);
  });
});

describe("helpers", () => {
  it("rounds the reading time up to at least one minute", () => {
    expect(readingMinutes(50)).toBe(1);
    expect(readingMinutes(1000)).toBe(5);
  });

  it("splits a title at the first colon for the two-tone heading", () => {
    expect(splitTitle("Uno: dos y tres")).toEqual({ head: "Uno:", accent: "dos y tres" });
    expect(splitTitle("Sin dos tonos")).toEqual({ head: "Sin dos tonos" });
  });

  it("resolves related posts in the order the frontmatter gives", () => {
    const a = entry("a", { relatedPosts: ["c", "b", "missing"] });
    expect(relatedPosts([a, entry("b"), entry("c")], a).map((post) => post.slug)).toEqual([
      "c",
      "b",
    ]);
  });
});

describe("blog sitemap", () => {
  const posts = [entry("a"), entry("b", { category: "react-native", updated: "2026-12-01" })];

  it("is empty without posts", () => {
    expect(blogSitemapEntries([])).toEqual([]);
  });

  it("lists the index, each used category and each post with its update date", () => {
    expect(blogSitemapEntries(posts).map((item) => item.path)).toEqual([
      "/blog",
      "/blog/tema/precios",
      "/blog/tema/react-native",
      "/blog/a",
      "/blog/b",
    ]);
    const site = resolveSite({ NEXT_PUBLIC_SITE_URL: productionOrigin });
    const urls = buildSitemap(site, ["es"], false, false, [], blogSitemapEntries(posts));
    expect(urls).toContainEqual({
      url: `${productionOrigin}/es/blog/b`,
      priority: 0.6,
      lastModified: "2026-12-01",
    });
  });
});

describe("published posts", () => {
  const entries = readContent(root).filter((item) => item.type === "blog");
  const metas = entries.map((item) => item.meta as BlogMeta);
  const source = (slug: string) => readFileSync(join(root, "content/blog", `${slug}.mdx`), "utf8");

  it("publishes the four articles and the two printable resources", () => {
    expect(entries).toHaveLength(6);
    expect(metas.filter((meta) => meta.kind === "resource")).toHaveLength(2);
  });

  it("keeps every title short enough for the title template", () => {
    for (const meta of metas) {
      expect((meta.metaTitle ?? meta.title).length).toBeLessThanOrEqual(47);
      expect(meta.description.length).toBeGreaterThanOrEqual(50);
      expect(meta.description.length).toBeLessThanOrEqual(160);
    }
  });

  it("gives each post a FAQ of three to five questions", () => {
    for (const meta of metas) {
      expect(meta.faq.length).toBeGreaterThanOrEqual(3);
      expect(meta.faq.length).toBeLessThanOrEqual(5);
    }
  });

  it("points related posts to other existing posts, two each", () => {
    const slugs = new Set(metas.map((meta) => meta.slug));
    for (const meta of metas) {
      expect(meta.relatedPosts).toHaveLength(2);
      for (const slug of meta.relatedPosts) {
        expect(slugs.has(slug)).toBe(true);
        expect(slug).not.toBe(meta.slug);
      }
    }
  });

  it("uses only known categories and keeps the writing within the plan length", () => {
    for (const item of entries) {
      const meta = item.meta as BlogMeta;
      expect(blogCategories).toContain(meta.category);
      if (meta.kind === "article") {
        const faqWords = meta.faq.reduce(
          (sum, entry) => sum + `${entry.question} ${entry.answer}`.split(/\s+/).length,
          0,
        );
        expect(item.words + faqWords).toBeGreaterThanOrEqual(800);
        expect(item.words + faqWords).toBeLessThanOrEqual(1400);
      }
    }
  });

  it("places the related service block once, in the first third, and never leaves placeholders", () => {
    for (const item of entries) {
      const body = source(item.slug).replace(/^---[\s\S]*?\n---\n/, "");
      const marks = body.split("<RelatedService />").length - 1;
      expect(marks).toBe(1);
      expect(body.indexOf("<RelatedService />") / body.length).toBeLessThan(0.45);
      expect(body).not.toContain("{{DATO");
    }
  });
});
