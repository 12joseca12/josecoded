import { describe, expect, it } from "vitest";

import {
  releaseVelocity,
  sheetDismissRatio,
  sheetDismissVelocity,
  sheetOffset,
  shouldDismissSheet,
} from "./sheet-drag";

describe("sheet drag", () => {
  it("follows the finger downwards from where the sheet was grabbed", () => {
    expect(sheetOffset(0, 100, 160)).toBe(60);
    expect(sheetOffset(30, 100, 160)).toBe(90);
  });

  it("never lifts the sheet above its resting place", () => {
    expect(sheetOffset(0, 100, 40)).toBe(0);
    expect(sheetOffset(20, 100, 50)).toBe(0);
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
});
