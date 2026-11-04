import { describe, expect, it } from "vitest";

import { getTranslator } from "@/i18n/messages";
import { packSlugPattern } from "@/types/contact-form";

import {
  hasProvisionalPacks,
  isPackProvisional,
  packCopyKeys,
  packs,
  packSlugs,
  packsSchema,
  publicPacks,
} from "./packs";

describe("packs", () => {
  it("has one entry per slug and every slug is a valid contact pack slug", () => {
    expect(packs.map((pack) => pack.slug)).toEqual([...packSlugs]);
    for (const pack of packs) expect(pack.slug).toMatch(packSlugPattern);
  });

  it("rejects duplicated slugs and unknown fields", () => {
    const entry = { slug: "app-movil", status: "final", from: "1" };
    expect(packsSchema.safeParse([entry, entry]).success).toBe(false);
    expect(packsSchema.safeParse([{ ...entry, extra: true }]).success).toBe(false);
  });

  it("marks placeholder packs as provisional and keeps them out of the public list", () => {
    expect(hasProvisionalPacks(packs)).toBe(true);
    expect(packs.every(isPackProvisional)).toBe(true);
    expect(publicPacks(packs)).toEqual([]);
  });

  it("publishes a pack once it is final", () => {
    const finals = packsSchema.parse([{ slug: "app-movil", status: "final", from: "1200" }]);
    expect(publicPacks(finals)).toHaveLength(1);
    expect(hasProvisionalPacks(finals)).toBe(false);
  });

  it.each(["es", "en"] as const)("has copy in %s for every pack", async (locale) => {
    const t = await getTranslator(locale);
    for (const slug of packSlugs) {
      const copy = packCopyKeys[slug];
      for (const key of [copy.name, copy.text, ...copy.bullets]) {
        expect(t(key).length).toBeGreaterThan(0);
      }
    }
  });
});
