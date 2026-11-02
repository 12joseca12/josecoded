import { describe, expect, it } from "vitest";

import {
  computeStops,
  ease,
  glideDuration,
  isActive,
  isEligible,
  planTarget,
  scrollProgress,
  type Viewport,
} from "./blocks";

const desktop: Viewport = {
  width: 1440,
  height: 900,
  finePointer: true,
  reducedMotion: false,
  dialogOpen: false,
};

describe("eligibility", () => {
  it("accepts a fine pointer on a large viewport", () => {
    expect(isEligible(desktop)).toBe(true);
  });

  it.each([
    ["coarse pointer", { finePointer: false }],
    ["reduced motion", { reducedMotion: true }],
    ["narrow", { width: 1023 }],
    ["short", { height: 599 }],
  ])("rejects %s", (_name, patch) => {
    expect(isEligible({ ...desktop, ...patch })).toBe(false);
  });

  it("is inactive while a dialog is open", () => {
    expect(isActive({ ...desktop, dialogOpen: true })).toBe(false);
    expect(isActive(desktop)).toBe(true);
  });

  it("accepts the exact thresholds", () => {
    expect(isEligible({ ...desktop, width: 1024, height: 600 })).toBe(true);
  });
});

describe("stops", () => {
  const sections = [
    { top: 0, end: 900 },
    { top: 900, end: 3000 },
    { top: 3000, end: 3900 },
  ];

  it("adds entry and exit stops for blocks taller than the viewport", () => {
    expect(computeStops(sections, 900, 3900)).toEqual([
      { y: 0, inside: false },
      { y: 900, inside: true },
      { y: 2100, inside: false },
      { y: 3000, inside: false },
    ]);
  });

  it("clamps stops to the scrollable range", () => {
    const stops = computeStops([{ top: 0, end: 900 }], 900, 900);
    expect(stops).toEqual([{ y: 0, inside: false }]);
  });

  it("merges stops closer than a tenth of the viewport", () => {
    const stops = computeStops(
      [
        { top: 0, end: 60 },
        { top: 60, end: 1000 },
        { top: 1000, end: 1900 },
      ],
      900,
      1900,
    );
    expect(stops.map((stop) => stop.y)).toEqual([0, 1000]);
  });
});

describe("planTarget", () => {
  const stops = [
    { y: 0, inside: false },
    { y: 900, inside: true },
    { y: 2100, inside: false },
    { y: 3000, inside: false },
  ];

  it("goes to the next stop from a block", () => {
    expect(planTarget(stops, 0, 1, 100)).toBe(900);
    expect(planTarget(stops, 2100, 1, 100)).toBe(3000);
  });

  it("stays native inside a tall block until the exit edge", () => {
    expect(planTarget(stops, 900, 1, 100)).toBeNull();
    expect(planTarget(stops, 2050, 1, 100)).toBe(2100);
  });

  it("goes to the previous stop and respects the tall block entry edge", () => {
    expect(planTarget(stops, 3000, -1, -100)).toBe(2100);
    expect(planTarget(stops, 2100, -1, -100)).toBeNull();
    expect(planTarget(stops, 950, -1, -100)).toBe(900);
    expect(planTarget(stops, 900, -1, -100)).toBe(0);
  });

  it("returns null at the ends", () => {
    expect(planTarget(stops, 3000, 1, 100)).toBeNull();
    expect(planTarget(stops, 0, -1, -100)).toBeNull();
  });
});

describe("motion curve", () => {
  it("is anchored and symmetric", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
  });

  it("scales duration with distance up to a cap", () => {
    expect(glideDuration(100, 900)).toBe(300);
    expect(glideDuration(900, 900)).toBe(800);
    expect(glideDuration(90000, 900)).toBe(1100);
  });
});

describe("scrollProgress", () => {
  it("maps scroll position to 0..1", () => {
    expect(scrollProgress(0, 900, 2900)).toBe(0);
    expect(scrollProgress(1000, 900, 2900)).toBe(0.5);
    expect(scrollProgress(2000, 900, 2900)).toBe(1);
  });

  it("clamps overscroll and handles unscrollable pages", () => {
    expect(scrollProgress(-50, 900, 2900)).toBe(0);
    expect(scrollProgress(5000, 900, 2900)).toBe(1);
    expect(scrollProgress(0, 900, 900)).toBe(0);
  });
});
