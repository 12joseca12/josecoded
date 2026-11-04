import { describe, expect, it } from "vitest";

import { buildContactHref, resolveInitialWay } from "./ways";

describe("buildContactHref", () => {
  it("uses the unified via values and the form anchor", () => {
    expect(buildContactHref("es", "contratacion")).toBe("/es/contacto?via=hiring#formulario");
    expect(buildContactHref("es", "freelance")).toBe("/es/contacto?via=freelance#formulario");
    expect(buildContactHref("es", "packs")).toBe("/es/contacto?via=pack#formulario");
  });

  it("adds the pack only for the packs way", () => {
    expect(buildContactHref("es", "packs", "app-movil")).toBe(
      "/es/contacto?via=pack&pack=app-movil#formulario",
    );
    expect(buildContactHref("es", "freelance", "app-movil")).toBe(
      "/es/contacto?via=freelance#formulario",
    );
  });
});

describe("resolveInitialWay", () => {
  it("reads the unified values", () => {
    expect(resolveInitialWay({ via: "hiring" })).toBe("contratacion");
    expect(resolveInitialWay({ via: "freelance" })).toBe("freelance");
    expect(resolveInitialWay({ via: "pack" })).toBe("packs");
  });

  it("keeps accepting the old values", () => {
    expect(resolveInitialWay({ via: "contratacion" })).toBe("contratacion");
    expect(resolveInitialWay({ via: "packs" })).toBe("packs");
  });

  it("falls back to the pack param and to null", () => {
    expect(resolveInitialWay({ pack: "app-movil" })).toBe("packs");
    expect(resolveInitialWay({ via: "other" })).toBeNull();
    expect(resolveInitialWay({})).toBeNull();
  });
});
