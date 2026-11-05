import { describe, expect, it } from "vitest";

import { isTimelineKey, nextPhaseIndex, progressOf } from "./timeline";

describe("nextPhaseIndex", () => {
  it("moves forward and wraps to the first phase", () => {
    expect(nextPhaseIndex("ArrowRight", 0, 5)).toBe(1);
    expect(nextPhaseIndex("ArrowDown", 4, 5)).toBe(0);
  });

  it("moves back and wraps to the last phase", () => {
    expect(nextPhaseIndex("ArrowLeft", 3, 5)).toBe(2);
    expect(nextPhaseIndex("ArrowUp", 0, 5)).toBe(4);
  });

  it("jumps to the ends", () => {
    expect(nextPhaseIndex("Home", 3, 5)).toBe(0);
    expect(nextPhaseIndex("End", 1, 5)).toBe(4);
  });
});

describe("isTimelineKey", () => {
  it("accepts navigation keys only", () => {
    expect(isTimelineKey("Home")).toBe(true);
    expect(isTimelineKey("Enter")).toBe(false);
    expect(isTimelineKey("a")).toBe(false);
  });
});

describe("progressOf", () => {
  it("is a ratio between 0 and 1", () => {
    expect(progressOf(0, 5)).toBe(0);
    expect(progressOf(2, 5)).toBe(0.5);
    expect(progressOf(4, 5)).toBe(1);
    expect(progressOf(0, 1)).toBe(0);
  });
});
