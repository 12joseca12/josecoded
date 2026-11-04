import { describe, expect, it } from "vitest";

import { parseSelection, selectionPath } from "./selection";

describe("parseSelection", () => {
  it("returns null when nothing valid was asked for", () => {
    expect(parseSelection({})).toBeNull();
    expect(parseSelection({ offer: "nope", extras: "nada" })).toBeNull();
  });

  it("reads one offer and its extras, comma separated or repeated", () => {
    expect(parseSelection({ offer: "app-producto", extras: "payments,offline" })).toEqual({
      offers: ["app-producto"],
      extras: ["payments", "offline"],
    });
    expect(parseSelection({ offer: "app-producto", extras: ["offline", "payments"] })).toEqual({
      offers: ["app-producto"],
      extras: ["payments", "offline"],
    });
  });

  it("keeps one tier per platform and orders them web first", () => {
    expect(
      parseSelection({ offer: "app-producto,web-negocio,web-plataforma,app-primera-version" }),
    ).toEqual({ offers: ["web-negocio", "app-producto"], extras: [] });
  });

  it("drops extras that cannot apply to the chosen offers, silently", () => {
    expect(parseSelection({ offer: "web-negocio", extras: "push,seo,bogus" })).toEqual({
      offers: ["web-negocio"],
      extras: ["seo"],
    });
  });

  it("accepts extras alone, from the catalogue", () => {
    expect(parseSelection({ extras: ["seo", "push"] })).toEqual({
      offers: [],
      extras: ["seo", "push"],
    });
  });

  it("maps the old pack param to the new tiers", () => {
    expect(parseSelection({ pack: "app-movil" })?.offers).toEqual(["app-primera-version"]);
    expect(parseSelection({ pack: "web-y-app" })?.offers).toEqual([
      "web-negocio",
      "app-primera-version",
    ]);
    expect(parseSelection({ pack: "web-basico" })).toBeNull();
    expect(parseSelection({ pack: "app-movil", offer: "app-producto" })?.offers).toEqual([
      "app-producto",
    ]);
  });
});

describe("selectionPath", () => {
  it("writes readable commas and nothing for an empty selection", () => {
    expect(selectionPath({ offers: ["web-negocio"], extras: ["seo", "ai"] })).toBe(
      "?offer=web-negocio&extras=seo,ai",
    );
    expect(selectionPath({ offers: [], extras: [] })).toBe("");
  });
});
