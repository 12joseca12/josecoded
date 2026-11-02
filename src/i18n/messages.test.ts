import { describe, expect, it } from "vitest";

import { isLocale, isPublished } from "./config";
import { getTranslator } from "./messages";

describe("locale config", () => {
  it("recognises only declared locales", () => {
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("publishes es and keeps en hidden", () => {
    expect(isPublished("es")).toBe(true);
    expect(isPublished("en")).toBe(false);
  });
});

describe("getTranslator", () => {
  it("resolves a nested key", async () => {
    const t = await getTranslator("es");
    expect(t("home.name")).toBe("josecoded");
  });

  it("throws on a key missing from the locale", async () => {
    const t = await getTranslator("es");
    expect(() => t("nope.missing" as never)).toThrow('Missing message "nope.missing"');
  });
});
