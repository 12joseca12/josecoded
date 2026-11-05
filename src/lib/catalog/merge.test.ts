import { describe, expect, it } from "vitest";

import { extras as codeExtras, offerOf, priceOf } from "@/lib/services/offers";
import type { CatalogRows } from "@/types/catalog";

import { codeCatalog, formatAmount, mergeCatalog } from "./merge";

const emptyPrices: CatalogRows = {
  offers: [
    { slug: "web-presencia", price: null, weeks_min: 2, weeks_max: 3, sort: 10 },
    { slug: "web-negocio", price: null, weeks_min: 4, weeks_max: 6, sort: 20 },
  ],
  extras: codeExtras
    .filter((extra) => extra.slug !== "maintenance")
    .map((extra, index) => ({ slug: extra.slug, price: null, sort: (index + 1) * 10 })),
  rates: [
    { code: "hourly", price: null },
    { code: "task_min", price: null },
  ],
  plans: [
    { slug: "s", price_monthly: null, sort: 10 },
    { slug: "m", price_monthly: null, sort: 20 },
    { slug: "l", price_monthly: null, sort: 30 },
  ],
};

describe("formatAmount", () => {
  it("keeps whole euros plain and decimals at two places", () => {
    expect(formatAmount(1200)).toBe("1200");
    expect(formatAmount(1200.5)).toBe("1200.50");
  });
});

describe("mergeCatalog", () => {
  it("falls back to the code catalog when there are no rows", () => {
    expect(mergeCatalog(null)).toBe(codeCatalog);
  });

  it("keeps everything under review while every price is null", () => {
    const catalog = mergeCatalog(emptyPrices);
    expect(catalog.offers.every((offer) => offer.status === "provisional")).toBe(true);
    expect(catalog.extras.every((extra) => extra.status === "provisional")).toBe(true);
    expect(catalog.rates).toEqual(codeCatalog.rates);
    expect(catalog.plans).toEqual({ S: null, M: null, L: null });
    expect(priceOf(["web-presencia"], ["seo"], {}, catalog).provisional).toBe(true);
  });

  it("applies offer prices and weeks from the database", () => {
    const catalog = mergeCatalog({
      ...emptyPrices,
      offers: [{ slug: "web-presencia", price: 1200.5, weeks_min: 3, weeks_max: 5, sort: 10 }],
    });
    expect(offerOf("web-presencia", catalog)).toMatchObject({
      status: "final",
      from: "1200.50",
      weeksMin: 3,
      weeksMax: 5,
    });
    expect(offerOf("web-negocio", catalog).status).toBe("provisional");
  });

  it("ignores an inverted weeks range", () => {
    const catalog = mergeCatalog({
      ...emptyPrices,
      offers: [{ slug: "web-presencia", price: 900, weeks_min: 9, weeks_max: 3, sort: 10 }],
    });
    expect(offerOf("web-presencia", catalog)).toEqual(offerOf("web-presencia"));
  });

  it("prices a selection only when every piece has a price", () => {
    const catalog = mergeCatalog({
      ...emptyPrices,
      offers: [{ slug: "web-presencia", price: 1000, weeks_min: 2, weeks_max: 3, sort: 10 }],
      extras: emptyPrices.extras.map((row) => (row.slug === "seo" ? { ...row, price: 250 } : row)),
    });
    expect(priceOf(["web-presencia"], ["seo"], {}, catalog)).toEqual({
      once: "1250",
      monthly: "0",
      provisional: false,
    });
    expect(priceOf(["web-presencia"], ["seo", "ai"], {}, catalog).provisional).toBe(true);
  });

  it("derives the maintenance price from the cheapest plan and exposes each plan", () => {
    const catalog = mergeCatalog({
      ...emptyPrices,
      plans: [
        { slug: "s", price_monthly: 49, sort: 10 },
        { slug: "m", price_monthly: 99, sort: 20 },
        { slug: "l", price_monthly: null, sort: 30 },
      ],
    });
    expect(catalog.plans).toEqual({ S: "49", M: "99", L: null });
    const maintenance = catalog.extras.find((extra) => extra.slug === "maintenance");
    expect(maintenance).toMatchObject({ status: "final", from: "49" });
  });

  it("shows rates only when both are set", () => {
    const one = mergeCatalog({ ...emptyPrices, rates: [{ code: "hourly", price: 60 }] });
    expect(one.rates).toEqual(codeCatalog.rates);
    const both = mergeCatalog({
      ...emptyPrices,
      rates: [
        { code: "hourly", price: 60 },
        { code: "task_min", price: 150 },
      ],
    });
    expect(both.rates).toEqual({ status: "final", hour: "60", task: "150" });
  });

  it("hides extras missing from the public view and follows the database order", () => {
    const rows = emptyPrices.extras.filter((row) => row.slug !== "seo");
    const swapped = rows.map((row) => (row.slug === "accounts" ? { ...row, sort: 500 } : row));
    const catalog = mergeCatalog({ ...emptyPrices, extras: swapped });
    expect(catalog.hiddenExtras).toEqual(["seo"]);
    expect(catalog.extras.some((extra) => extra.slug === "seo")).toBe(true);
    const order = catalog.extras.map((extra) => extra.slug);
    expect(order.at(-1)).toBe("accounts");
    expect(order.indexOf("maintenance")).toBe(
      codeExtras.findIndex((extra) => extra.slug === "maintenance"),
    );
  });

  it("hides nothing when the extras view is empty", () => {
    expect(mergeCatalog({ ...emptyPrices, extras: [] }).hiddenExtras).toEqual([]);
  });
});
