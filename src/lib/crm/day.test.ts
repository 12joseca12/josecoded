import { describe, expect, it } from "vitest";

import { madridDayBounds } from "./day";

function bounds(iso: string) {
  const { start, end } = madridDayBounds(new Date(iso));
  return [start.toISOString(), end.toISOString()];
}

describe("madridDayBounds", () => {
  it("covers the Madrid day in winter time", () => {
    expect(bounds("2026-11-05T20:00:00Z")).toEqual([
      "2026-11-04T23:00:00.000Z",
      "2026-11-05T23:00:00.000Z",
    ]);
  });

  it("covers the Madrid day in summer time", () => {
    expect(bounds("2026-07-01T10:00:00Z")).toEqual([
      "2026-06-30T22:00:00.000Z",
      "2026-07-01T22:00:00.000Z",
    ]);
  });

  it("moves to the next Madrid day after local midnight while UTC is still the same date", () => {
    expect(bounds("2026-11-05T23:30:00Z")).toEqual([
      "2026-11-05T23:00:00.000Z",
      "2026-11-06T23:00:00.000Z",
    ]);
  });

  it("handles the 25 hour day when summer time ends", () => {
    expect(bounds("2026-10-25T12:00:00Z")).toEqual([
      "2026-10-24T22:00:00.000Z",
      "2026-10-25T23:00:00.000Z",
    ]);
  });

  it("handles the 23 hour day when summer time starts", () => {
    expect(bounds("2026-03-29T12:00:00Z")).toEqual([
      "2026-03-28T23:00:00.000Z",
      "2026-03-29T22:00:00.000Z",
    ]);
  });

  it("rolls over month and year ends", () => {
    expect(bounds("2026-12-31T12:00:00Z")).toEqual([
      "2026-12-30T23:00:00.000Z",
      "2026-12-31T23:00:00.000Z",
    ]);
  });
});
