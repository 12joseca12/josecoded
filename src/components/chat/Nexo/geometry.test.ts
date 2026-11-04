import { describe, expect, it } from "vitest";

import { orbit, orbitPaths } from "./geometry";

const ys = (path: string) =>
  [...path.matchAll(/[ML]-?[\d.]+ (-?[\d.]+)/g)].map((match) => Number(match[1]));

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

describe("orbitPaths", () => {
  it("draws both the front and the back arc", () => {
    const { front, back } = orbitPaths(orbit.restPrecession, orbit.restPhase);
    expect(front.startsWith("M")).toBe(true);
    expect(back.startsWith("M")).toBe(true);
  });

  it("keeps the front arc lower on screen than the back arc", () => {
    const { front, back } = orbitPaths(0, 0);
    expect(average(ys(front))).toBeGreaterThan(average(ys(back)));
  });

  it("wobbles: the arcs move as the precession turns", () => {
    const highest = (precession: number) => Math.min(...ys(orbitPaths(precession, 0).back));
    expect(Math.abs(highest(0) - highest(0.25))).toBeGreaterThan(1);
  });

  it("is periodic over a full precession turn", () => {
    expect(orbitPaths(0.3, 0.2)).toEqual(orbitPaths(1.3, 0.2));
  });
});
