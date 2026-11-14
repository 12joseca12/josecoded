import { describe, expect, it } from "vitest";

import {
  approximateMinutes,
  describeApproximate,
  formatCountdown,
  remainingFraction,
} from "./nexo-bar";

const due = "2026-11-14T10:10:00.000Z";
const at = (iso: string) => Date.parse(iso);
const labels = { approxMinutes: "unos {minutes} minutos", approxSoon: "menos de un minuto" };

describe("formatCountdown", () => {
  it("formats minutes without padding and seconds with padding", () => {
    expect(formatCountdown(due, at("2026-11-14T10:02:18.000Z"))).toBe("7:42");
  });

  it("rounds partial seconds up", () => {
    expect(formatCountdown(due, at("2026-11-14T10:09:59.200Z"))).toBe("0:01");
  });

  it("clamps a past deadline to 0:00", () => {
    expect(formatCountdown(due, at("2026-11-14T10:30:00.000Z"))).toBe("0:00");
  });

  it("does not wrap minutes past an hour", () => {
    expect(formatCountdown(due, at("2026-11-14T08:55:00.000Z"))).toBe("75:00");
  });

  it("falls back to 0:00 on an invalid date", () => {
    expect(formatCountdown("nope", 0)).toBe("0:00");
  });
});

describe("approximateMinutes", () => {
  it("rounds up to whole minutes", () => {
    expect(approximateMinutes(due, at("2026-11-14T10:02:18.000Z"))).toBe(8);
  });

  it("stays stable within the same minute", () => {
    const a = approximateMinutes(due, at("2026-11-14T10:02:10.000Z"));
    const b = approximateMinutes(due, at("2026-11-14T10:02:50.000Z"));
    expect(a).toBe(b);
  });
});

describe("describeApproximate", () => {
  it("fills the minutes in", () => {
    expect(describeApproximate(labels, due, at("2026-11-14T10:02:18.000Z"))).toBe("unos 8 minutos");
  });

  it("switches to the soon wording in the last minute", () => {
    expect(describeApproximate(labels, due, at("2026-11-14T10:09:30.000Z"))).toBe(
      "menos de un minuto",
    );
  });
});

describe("remainingFraction", () => {
  it("is the share of the window left", () => {
    expect(remainingFraction(due, at("2026-11-14T10:05:00.000Z"), 600_000)).toBeCloseTo(0.5);
  });

  it("clamps to the 0 to 1 range", () => {
    expect(remainingFraction(due, at("2026-11-14T10:30:00.000Z"), 600_000)).toBe(0);
    expect(remainingFraction(due, at("2026-11-14T09:00:00.000Z"), 600_000)).toBe(1);
  });
});
