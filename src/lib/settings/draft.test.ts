import { describe, expect, it } from "vitest";

import { fromDraft, toDraft } from "./draft";

describe("toDraft", () => {
  it("shows stored values as text and null as empty", () => {
    expect(toDraft("month", "2027-01")).toBe("2027-01");
    expect(toDraft("hours", null)).toBe("");
    expect(toDraft("delay", 10)).toBe("10");
    expect(toDraft("vat", 21)).toBe("21");
  });

  it("shows the maintenance end as Madrid local time", () => {
    expect(toDraft("maintenance", { on: true, until: "2026-11-06T07:00:00Z" })).toBe(
      "2026-11-06T08:00",
    );
    expect(toDraft("maintenance", { on: false })).toBe("");
  });
});

describe("fromDraft", () => {
  it("turns an empty month, date or hours into null", () => {
    expect(fromDraft("month", " ", null)).toBeNull();
    expect(fromDraft("date", "", null)).toBeNull();
    expect(fromDraft("hours", "", null)).toBeNull();
  });

  it("reads whole numbers and rejects the rest", () => {
    expect(fromDraft("hours", "20", null)).toBe(20);
    expect(fromDraft("hours", "20.5", null)).toBeUndefined();
    expect(fromDraft("delay", "15", 10)).toBe(15);
    expect(fromDraft("delay", "", 10)).toBeUndefined();
    expect(fromDraft("delay", "-3", 10)).toBeUndefined();
  });

  it("reads a VAT rate with up to two decimals", () => {
    expect(fromDraft("vat", "21", 21)).toBe(21);
    expect(fromDraft("vat", "10.5", 21)).toBe(10.5);
    expect(fromDraft("vat", "10.555", 21)).toBeUndefined();
    expect(fromDraft("vat", "abc", 21)).toBeUndefined();
  });

  it("builds maintenance from the current switch and the typed end", () => {
    expect(fromDraft("maintenance", "", { on: true })).toEqual({ on: true });
    expect(fromDraft("maintenance", "2026-11-06T08:00", { on: true })).toEqual({
      on: true,
      until: "2026-11-06T08:00:00+01:00",
    });
    expect(fromDraft("maintenance", "garbage", { on: true })).toBeUndefined();
  });

  it("has no draft for a switch or a cadence", () => {
    expect(fromDraft("switch", "x", true)).toBeUndefined();
    expect(fromDraft("cadence", "x", "weekly")).toBeUndefined();
  });
});
