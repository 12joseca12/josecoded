import { describe, expect, it } from "vitest";

import { isValidPeriod, suggestPeriod } from "./payout-periods";

describe("suggestPeriod", () => {
  it("weekly proposes the previous full Monday to Sunday week", () => {
    expect(suggestPeriod("weekly", "2026-11-05")).toEqual({
      start: "2026-10-26",
      end: "2026-11-01",
    });
    expect(suggestPeriod("weekly", "2026-11-02")).toEqual({
      start: "2026-10-26",
      end: "2026-11-01",
    });
    expect(suggestPeriod("weekly", "2026-11-08")).toEqual({
      start: "2026-10-26",
      end: "2026-11-01",
    });
    expect(suggestPeriod("weekly", "2026-11-09")).toEqual({
      start: "2026-11-02",
      end: "2026-11-08",
    });
  });

  it("biweekly proposes the last closed half of a month", () => {
    expect(suggestPeriod("biweekly", "2026-11-05")).toEqual({
      start: "2026-10-16",
      end: "2026-10-31",
    });
    expect(suggestPeriod("biweekly", "2026-11-15")).toEqual({
      start: "2026-10-16",
      end: "2026-10-31",
    });
    expect(suggestPeriod("biweekly", "2026-11-16")).toEqual({
      start: "2026-11-01",
      end: "2026-11-15",
    });
    expect(suggestPeriod("biweekly", "2026-11-30")).toEqual({
      start: "2026-11-01",
      end: "2026-11-15",
    });
  });

  it("biweekly crosses year ends and short months", () => {
    expect(suggestPeriod("biweekly", "2027-01-03")).toEqual({
      start: "2026-12-16",
      end: "2026-12-31",
    });
    expect(suggestPeriod("biweekly", "2027-03-10")).toEqual({
      start: "2027-02-16",
      end: "2027-02-28",
    });
    expect(suggestPeriod("biweekly", "2028-03-10")).toEqual({
      start: "2028-02-16",
      end: "2028-02-29",
    });
  });

  it("per payment proposes the last thirty days", () => {
    expect(suggestPeriod("per_payment", "2026-11-05")).toEqual({
      start: "2026-10-07",
      end: "2026-11-05",
    });
  });
});

describe("isValidPeriod", () => {
  it("needs an ordered period of at most a year", () => {
    expect(isValidPeriod({ start: "2026-10-01", end: "2026-10-31" })).toBe(true);
    expect(isValidPeriod({ start: "2026-10-31", end: "2026-10-01" })).toBe(false);
    expect(isValidPeriod({ start: "2024-01-01", end: "2026-01-01" })).toBe(false);
    expect(isValidPeriod({ start: "2026-01-01", end: "2027-01-03" })).toBe(false);
    expect(isValidPeriod({ start: "2026-01-01", end: "2027-01-02" })).toBe(true);
    expect(isValidPeriod({ start: "nope", end: "2026-01-01" })).toBe(false);
  });
});
