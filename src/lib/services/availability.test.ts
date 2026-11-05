import { describe, expect, it } from "vitest";

import type { Availability } from "@/types/services";

import { freshAvailability, loadAvailability } from "./availability";

const now = new Date("2026-11-30T10:00:00Z");

function at(updatedAt: string, rest: Partial<Availability> = {}): Availability {
  return { weeklyHours: "15", updatedAt, ...rest };
}

describe("freshAvailability", () => {
  it("has no source yet, so nothing is shown", async () => {
    expect(await loadAvailability()).toBeNull();
    expect(freshAvailability(await loadAvailability(), now)).toBeNull();
  });

  it("keeps data updated within 30 days", () => {
    const data = at("2026-11-01T10:00:00Z");
    expect(freshAvailability(data, now)).toBe(data);
  });

  it("hides data older than 30 days", () => {
    expect(freshAvailability(at("2026-10-30T09:59:00Z"), now)).toBeNull();
  });

  it("hides data without a usable date", () => {
    expect(freshAvailability(at("not a date"), now)).toBeNull();
    expect(freshAvailability(at("2026-12-15T10:00:00Z"), now)).toBeNull();
  });

  it("hides data with nothing to say", () => {
    expect(freshAvailability({ updatedAt: "2026-11-20T10:00:00Z" }, now)).toBeNull();
  });
});
