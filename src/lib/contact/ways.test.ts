import { describe, expect, it } from "vitest";

import { buildContactHref, resolveInitialWay } from "./ways";

describe("buildContactHref", () => {
  it("uses the unified via values and the form anchor", () => {
    expect(buildContactHref("es", "contratacion")).toBe("/es/contacto?via=hiring#formulario");
    expect(buildContactHref("es", "freelance")).toBe("/es/contacto?via=freelance#formulario");
    expect(buildContactHref("es", "project")).toBe("/es/contacto?via=project#formulario");
  });

  it("adds the offer and the extras only for the project way", () => {
    const selection = { offers: ["app-producto" as const], extras: ["payments" as const, "push" as const] };
    expect(buildContactHref("es", "project", selection)).toBe(
      "/es/contacto?via=project&offer=app-producto&extras=payments,push#formulario",
    );
    expect(buildContactHref("es", "freelance", selection)).toBe(
      "/es/contacto?via=freelance#formulario",
    );
  });

  it("joins a web and an app tier in one offer parameter", () => {
    const selection = { offers: ["web-negocio" as const, "app-primera-version" as const], extras: [] };
    expect(buildContactHref("es", "project", selection)).toBe(
      "/es/contacto?via=project&offer=web-negocio,app-primera-version#formulario",
    );
  });
});

describe("resolveInitialWay", () => {
  it("reads the unified values", () => {
    expect(resolveInitialWay({ via: "hiring" })).toBe("contratacion");
    expect(resolveInitialWay({ via: "freelance" })).toBe("freelance");
    expect(resolveInitialWay({ via: "project" })).toBe("project");
  });

  it("keeps accepting the old values", () => {
    expect(resolveInitialWay({ via: "contratacion" })).toBe("contratacion");
    expect(resolveInitialWay({ via: "pack" })).toBe("project");
    expect(resolveInitialWay({ via: "packs" })).toBe("project");
  });

  it("falls back to the offer, extras and pack params and to null", () => {
    expect(resolveInitialWay({ offer: "app-producto" })).toBe("project");
    expect(resolveInitialWay({ extras: "seo" })).toBe("project");
    expect(resolveInitialWay({ pack: "app-movil" })).toBe("project");
    expect(resolveInitialWay({ via: "other" })).toBeNull();
    expect(resolveInitialWay({})).toBeNull();
  });
});
