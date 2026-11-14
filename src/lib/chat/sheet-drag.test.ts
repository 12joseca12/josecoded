import { describe, expect, it } from "vitest";

import {
  releaseVelocity,
  sheetDismissRatio,
  sheetDismissVelocity,
  sheetExitDuration,
  sheetExitMinVelocity,
  sheetOffset,
  sheetStretchLimit,
  shouldDismissSheet,
} from "./sheet-drag";

const bounds = { min: 180, max: 420 };

describe("sheet drag", () => {
  it("follows the finger downwards from where the sheet was grabbed", () => {
    expect(sheetOffset(0, 100, 160)).toBe(60);
    expect(sheetOffset(30, 100, 160)).toBe(90);
  });

  it("resists an upward pull and never lifts the sheet more than the stretch limit", () => {
    expect(sheetStretchLimit).toBe(14);
    const small = sheetOffset(0, 100, 95);
    expect(small).toBeLessThan(0);
    expect(small).toBeGreaterThan(-5);
    const long = sheetOffset(0, 100, -400);
    expect(long).toBeLessThan(sheetOffset(0, 100, 40));
    expect(long).toBeGreaterThan(-sheetStretchLimit);
    expect(sheetOffset(20, 100, 80)).toBe(0);
    expect(sheetOffset(20, 100, 50)).toBeLessThan(0);
  });

  it("measures the release speed over the last 100 ms only", () => {
    const samples = [
      { y: 0, t: 0 },
      { y: 10, t: 400 },
      { y: 20, t: 450 },
      { y: 40, t: 500 },
    ];
    expect(releaseVelocity(samples)).toBeCloseTo(0.3);
  });

  it("reads a pause before letting go as no speed", () => {
    const samples = [
      { y: 0, t: 0 },
      { y: 80, t: 100 },
      { y: 80, t: 400 },
    ];
    expect(releaseVelocity(samples)).toBe(0);
  });

  it("reads an upward flick as negative speed", () => {
    const samples = [
      { y: 100, t: 0 },
      { y: 60, t: 50 },
    ];
    expect(releaseVelocity(samples)).toBeCloseTo(-0.8);
  });

  it("has no speed without at least two samples", () => {
    expect(releaseVelocity([])).toBe(0);
    expect(releaseVelocity([{ y: 10, t: 10 }])).toBe(0);
  });

  it("dismisses past a quarter of the sheet even when released slowly", () => {
    expect(sheetDismissRatio).toBe(0.25);
    expect(shouldDismissSheet(201, 0, 800)).toBe(true);
    expect(shouldDismissSheet(199, 0, 800)).toBe(false);
  });

  it("dismisses a downward flick faster than 0.11 px/ms", () => {
    expect(sheetDismissVelocity).toBe(0.11);
    expect(shouldDismissSheet(30, 0.12, 800)).toBe(true);
    expect(shouldDismissSheet(30, 0.1, 800)).toBe(false);
  });

  it("ignores a flick that barely moved the sheet or went back up", () => {
    expect(shouldDismissSheet(4, 2, 800)).toBe(false);
    expect(shouldDismissSheet(120, -0.5, 800)).toBe(false);
    expect(shouldDismissSheet(300, -0.5, 800)).toBe(false);
  });

  it("counts only the distance dragged when the sheet was grabbed mid-opening", () => {
    const start = 300;
    const offset = sheetOffset(start, 100, 140);
    expect(shouldDismissSheet(offset - start, 0, 800)).toBe(false);
    expect(shouldDismissSheet(sheetOffset(start, 100, 310) - start, 0, 800)).toBe(true);
  });

  it("times the exit by the distance left and the release speed", () => {
    expect(sheetExitDuration(600, 2, bounds)).toBe(300);
    expect(sheetExitDuration(400, -2, bounds)).toBe(200);
  });

  it("keeps the exit between the fast and slow durations", () => {
    expect(sheetExitMinVelocity).toBe(1.2);
    expect(sheetExitDuration(700, 0, bounds)).toBe(420);
    expect(sheetExitDuration(100, 3, bounds)).toBe(180);
    expect(sheetExitDuration(-20, 1, bounds)).toBe(180);
  });
});
