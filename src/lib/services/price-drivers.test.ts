import { describe, expect, it } from "vitest";

import { offerSlugs } from "./offers";
import { priceDriversFor } from "./price-drivers";

describe("priceDriversFor", () => {
  it("lists accounts, payments and languages for the lightest web tiers", () => {
    expect(priceDriversFor("web-presencia")).toEqual(["accounts", "payments", "languages"]);
    expect(priceDriversFor("web-negocio")).toEqual(["accounts", "payments", "languages"]);
  });

  it("drops accounts where they already come included", () => {
    expect(priceDriversFor("web-plataforma")).toEqual(["payments", "languages"]);
    expect(priceDriversFor("app-primera-version")).toEqual(["payments", "languages"]);
    expect(priceDriversFor("app-producto")).toEqual(["payments", "languages"]);
  });

  it("always leaves at least one driver", () => {
    for (const slug of offerSlugs) expect(priceDriversFor(slug).length).toBeGreaterThan(0);
  });
});
