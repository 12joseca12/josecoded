import { describe, expect, it } from "vitest";

import { getTranslator } from "@/i18n/messages";
import { slugPattern } from "@/types/contact-form";

import {
  extraAppliesTo,
  extraCopyKeys,
  extraIncludedIn,
  extraOf,
  extras,
  extraSchema,
  type ExtraSlug,
  extraSlugs,
  extrasSchema,
  hasProvisionalOffers,
  isProvisional,
  lowestOfferFrom,
  offerCopyKeys,
  offers,
  offerSchema,
  offerSlugs,
  offersOn,
  offersSchema,
  priceOf,
  publicOffers,
} from "./offers";

const validOffer = {
  slug: "web-negocio",
  platform: "web",
  status: "final",
  from: "1",
  weeksMin: 2,
  weeksMax: 3,
};

describe("offers", () => {
  it("has one entry per slug, three web tiers and two app tiers", () => {
    expect(offers.map((offer) => offer.slug)).toEqual([...offerSlugs]);
    expect(offersOn("web")).toHaveLength(3);
    expect(offersOn("app")).toHaveLength(2);
    for (const offer of offers) expect(offer.slug).toMatch(slugPattern);
  });

  it("orders the tiers of a platform from lighter to heavier", () => {
    for (const platform of ["web", "app"] as const) {
      const tiers = offersOn(platform);
      expect(tiers).toEqual([...tiers].sort((a, b) => a.weeksMax - b.weeksMax));
    }
  });

  it("rejects duplicated slugs, unknown fields, inverted ranges and foreign platforms", () => {
    expect(offersSchema.safeParse([validOffer, validOffer]).success).toBe(false);
    expect(offersSchema.safeParse([{ ...validOffer, extra: true }]).success).toBe(false);
    expect(offerSchema.safeParse({ ...validOffer, weeksMin: 5 }).success).toBe(false);
    expect(offerSchema.safeParse({ ...validOffer, platform: "app" }).success).toBe(false);
    expect(offerSchema.safeParse({ ...validOffer, from: "12 €" }).success).toBe(false);
    expect(offerSchema.safeParse(validOffer).success).toBe(true);
  });

  it("marks placeholder offers as provisional and keeps them out of the public list", () => {
    expect(hasProvisionalOffers(offers)).toBe(true);
    expect(offers.every(isProvisional)).toBe(true);
    expect(publicOffers(offers)).toEqual([]);
  });

  it("publishes an offer once it is final and returns the lowest starting price", () => {
    const list = offersSchema.parse([
      { ...validOffer, slug: "web-presencia", from: "900" },
      { ...validOffer, from: "1800" },
    ]);
    expect(publicOffers(list)).toHaveLength(2);
    expect(lowestOfferFrom(list)).toBe("900");
    expect(() => lowestOfferFrom([])).toThrow();
  });
});

describe("extras", () => {
  const validExtra = {
    slug: "seo",
    billing: "once",
    status: "final",
    from: "1",
    applies: ["web-negocio"],
    includedIn: [],
  };

  it("has the twelve extras of the catalogue, once each", () => {
    expect(extras.map((extra) => extra.slug)).toEqual([...extraSlugs]);
    expect(extras).toHaveLength(12);
  });

  it("only includes an extra where it applies", () => {
    for (const extra of extras) {
      for (const slug of extra.includedIn) expect(extra.applies).toContain(slug);
    }
    expect(extraSchema.safeParse({ ...validExtra, includedIn: ["app-producto"] }).success).toBe(
      false,
    );
    expect(extraSchema.safeParse(validExtra).success).toBe(true);
  });

  it("rejects duplicated extras", () => {
    expect(extrasSchema.safeParse([validExtra, validExtra]).success).toBe(false);
  });

  it("keeps mobile extras off the web tiers and SEO off the app tiers", () => {
    for (const slug of ["push", "offline", "stores"] as const) {
      expect(extraAppliesTo(extraOf(slug), ["web-negocio"])).toBe(false);
      expect(extraAppliesTo(extraOf(slug), ["app-producto"])).toBe(true);
    }
    expect(extraAppliesTo(extraOf("seo"), ["app-producto"])).toBe(false);
  });

  it("tells where an extra already comes included", () => {
    const admin = extraOf("admin");
    expect(extraIncludedIn(admin, ["web-negocio"])).toBe(true);
    expect(extraIncludedIn(admin, ["web-presencia"])).toBe(false);
    expect(extraIncludedIn(admin, ["web-negocio", "app-primera-version"])).toBe(false);
    expect(extraIncludedIn(extraOf("push"), ["web-negocio"])).toBe(false);
  });
});

describe("priceOf", () => {
  it("shows the provisional placeholder while any figure is provisional", () => {
    expect(priceOf(["web-negocio"], ["payments", "maintenance"])).toEqual({
      once: "000",
      monthly: "000",
      provisional: true,
    });
  });

  it("adds up final figures and counts per-unit extras by unit", () => {
    const sample = offersSchema.parse([{ ...validOffer, from: "1000" }]);
    expect(sample[0]?.from).toBe("1000");
    const extra = extraOf("languages");
    expect(extra.billing).toBe("per_unit");
    const slugs: ExtraSlug[] = ["languages"];
    expect(priceOf(["web-negocio"], slugs, { languages: 3 }).provisional).toBe(true);
  });
});

describe.each(["es", "en"] as const)("copy in %s", (locale) => {
  it("exists for every offer and extra", async () => {
    const t = await getTranslator(locale);
    for (const slug of offerSlugs) {
      const copy = offerCopyKeys(slug);
      for (const key of [copy.name, copy.audience, ...copy.includes, ...copy.excludes]) {
        expect(t(key).length).toBeGreaterThan(0);
      }
    }
    for (const slug of extraSlugs) {
      const copy = extraCopyKeys(slug);
      expect(t(copy.name).length).toBeGreaterThan(0);
      expect(t(copy.text).length).toBeGreaterThan(0);
    }
  });
});
