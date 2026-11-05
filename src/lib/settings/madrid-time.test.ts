import { describe, expect, it } from "vitest";

import { formatMadridStamp, isoToMadridLocal, madridLocalToIso } from "./madrid-time";

describe("madridLocalToIso", () => {
  it("uses the winter offset in November", () => {
    expect(madridLocalToIso("2026-11-06T08:00")).toBe("2026-11-06T08:00:00+01:00");
  });

  it("uses the summer offset in July", () => {
    expect(madridLocalToIso("2026-07-15T23:30")).toBe("2026-07-15T23:30:00+02:00");
  });

  it("switches offset on the day the clocks change", () => {
    expect(madridLocalToIso("2026-03-29T01:30")).toBe("2026-03-29T01:30:00+01:00");
    expect(madridLocalToIso("2026-03-29T04:00")).toBe("2026-03-29T04:00:00+02:00");
    expect(madridLocalToIso("2026-10-25T04:00")).toBe("2026-10-25T04:00:00+01:00");
  });

  it("rejects anything that is not a local date and time", () => {
    expect(madridLocalToIso("")).toBeNull();
    expect(madridLocalToIso("2026-11-06")).toBeNull();
    expect(madridLocalToIso("tomorrow")).toBeNull();
  });
});

describe("isoToMadridLocal", () => {
  it("shows the wall clock of Madrid for an instant", () => {
    expect(isoToMadridLocal("2026-11-06T07:00:00Z")).toBe("2026-11-06T08:00");
    expect(isoToMadridLocal("2026-07-15T21:30:00Z")).toBe("2026-07-15T23:30");
  });

  it("round trips with madridLocalToIso", () => {
    const local = "2026-12-24T18:45";
    const iso = madridLocalToIso(local);
    expect(iso).not.toBeNull();
    expect(isoToMadridLocal(iso ?? "")).toBe(local);
  });

  it("returns an empty string for an invalid instant", () => {
    expect(isoToMadridLocal("nope")).toBe("");
  });
});

describe("formatMadridStamp", () => {
  it("formats in the Madrid time zone whatever the server zone is", () => {
    expect(formatMadridStamp("2026-11-06T07:00:00Z", "es")).toContain("8:00");
  });

  it("returns the input when it is not a date", () => {
    expect(formatMadridStamp("nope", "es")).toBe("nope");
  });
});
