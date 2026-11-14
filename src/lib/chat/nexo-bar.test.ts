import { describe, expect, it } from "vitest";

import { formatCountdown } from "./nexo-bar";

const due = "2026-11-14T10:10:00.000Z";
const at = (iso: string) => Date.parse(iso);

describe("formatCountdown", () => {
  it("formats minutes and seconds with padding", () => {
    expect(formatCountdown(due, at("2026-11-14T10:02:18.000Z"))).toBe("07:42");
  });

  it("rounds partial seconds up", () => {
    expect(formatCountdown(due, at("2026-11-14T10:09:59.200Z"))).toBe("00:01");
  });

  it("clamps a past deadline to 00:00", () => {
    expect(formatCountdown(due, at("2026-11-14T10:30:00.000Z"))).toBe("00:00");
  });

  it("does not wrap minutes past an hour", () => {
    expect(formatCountdown(due, at("2026-11-14T08:55:00.000Z"))).toBe("75:00");
  });

  it("falls back to 00:00 on an invalid date", () => {
    expect(formatCountdown("nope", 0)).toBe("00:00");
  });
});
