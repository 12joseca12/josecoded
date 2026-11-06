import { afterEach, describe, expect, it, vi } from "vitest";

import { currentInstant, todayInMadrid } from "./dates";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("todayInMadrid", () => {
  it("is already the next day at 23:30 UTC in winter (CET)", () => {
    expect(todayInMadrid(new Date("2026-11-06T23:30:00Z"))).toBe("2026-11-07");
  });

  it("is still the same day at 22:59 UTC in winter", () => {
    expect(todayInMadrid(new Date("2026-11-06T22:59:00Z"))).toBe("2026-11-06");
  });

  it("is the next day at 22:30 UTC in summer (CEST)", () => {
    expect(todayInMadrid(new Date("2026-07-06T22:30:00Z"))).toBe("2026-07-07");
  });

  it("is still the same day at 21:59 UTC in summer", () => {
    expect(todayInMadrid(new Date("2026-07-06T21:59:00Z"))).toBe("2026-07-06");
  });

  it("rolls over the year", () => {
    expect(todayInMadrid(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });
});

describe("currentInstant", () => {
  it("honors the forced instant only with dev pages enabled", () => {
    vi.stubEnv("E2E_FAKE_NOW", "2026-11-06T23:30:00Z");
    vi.stubEnv("ENABLE_DEV_PAGES", "true");
    expect(currentInstant().toISOString()).toBe("2026-11-06T23:30:00.000Z");
    vi.stubEnv("ENABLE_DEV_PAGES", "");
    expect(currentInstant().getTime()).not.toBe(new Date("2026-11-06T23:30:00Z").getTime());
  });
});
