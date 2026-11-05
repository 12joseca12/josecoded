import { describe, expect, it } from "vitest";

import { listLegal } from "@/content";
import { getTranslator } from "@/i18n/messages";

import { indexedLegalPaths, isLegalIndexed, isLegalSlug, legalPages, legalSlugs } from "./pages";

describe("legal pages", () => {
  it("has a content file for every route and no extra files", () => {
    expect(
      listLegal()
        .map((entry) => entry.slug)
        .sort(),
    ).toEqual([...legalSlugs].sort());
  });

  it("keeps cookies out of the index and drafts out of everything", () => {
    expect(isLegalIndexed("privacidad", { draft: false })).toBe(true);
    expect(isLegalIndexed("privacidad", { draft: true })).toBe(false);
    expect(isLegalIndexed("cookies", { draft: false })).toBe(false);
  });

  it("lists only published indexable pages for the sitemap", () => {
    expect(
      indexedLegalPaths([
        { slug: "aviso-legal", meta: { draft: false } },
        { slug: "privacidad", meta: { draft: true } },
        { slug: "cookies", meta: { draft: false } },
        { slug: "otro", meta: { draft: false } },
      ]),
    ).toEqual(["/legal/aviso-legal"]);
  });

  it("recognises only known slugs", () => {
    expect(isLegalSlug("cookies")).toBe(true);
    expect(isLegalSlug("aviso")).toBe(false);
  });

  it("has SEO copy of a sensible length for every page", async () => {
    const t = await getTranslator("es");
    for (const page of Object.values(legalPages)) {
      expect(t(page.title).length).toBeLessThanOrEqual(48);
      expect(t(page.description).length).toBeGreaterThanOrEqual(50);
      expect(t(page.description).length).toBeLessThanOrEqual(160);
    }
  });

  it("gives every published page its own summary of at most five lines", () => {
    for (const entry of listLegal()) {
      expect(entry.meta.summary.length).toBeGreaterThan(0);
      expect(entry.headings.length).toBeGreaterThan(1);
    }
  });

  it("publishes all three pages as final, updated on the same day, with a five-line summary", () => {
    const entries = listLegal();
    expect(entries).toHaveLength(3);
    for (const entry of entries) {
      expect(entry.meta.draft).toBe(false);
      expect(entry.meta.updated).toBe("2026-11-05");
      expect(entry.meta.summary).toHaveLength(5);
    }
    expect(indexedLegalPaths(entries)).toEqual(["/legal/aviso-legal", "/legal/privacidad"]);
  });
});
