import { describe, expect, it } from "vitest";

import { bubbleGeometry, bubbleLimits } from "./bubbles";

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

describe("bubbleGeometry", () => {
  it("emits between five and seven bubbles", () => {
    const counts = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const { length } = bubbleGeometry(seeded(seed));
      expect(length).toBeGreaterThanOrEqual(bubbleLimits.countMin);
      expect(length).toBeLessThanOrEqual(bubbleLimits.countMax);
      counts.add(length);
    }
    expect(counts.size).toBe(3);
  });

  it("keeps size and travel distance inside the limits", () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const { dx, dy, size } of bubbleGeometry(seeded(seed))) {
        const distance = Math.hypot(dx, dy);
        expect(distance).toBeGreaterThanOrEqual(bubbleLimits.distanceMin - 0.01);
        expect(distance).toBeLessThanOrEqual(bubbleLimits.distanceMax + 0.01);
        expect(size).toBeGreaterThanOrEqual(bubbleLimits.sizeMin);
        expect(size).toBeLessThanOrEqual(bubbleLimits.sizeMax);
      }
    }
  });

  it("spreads the bubbles around the full circle, one per sector", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const bubbles = bubbleGeometry(seeded(seed));
      const sector = (Math.PI * 2) / bubbles.length;
      bubbles.forEach(({ dx, dy }, index) => {
        const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
        expect(angle).toBeGreaterThanOrEqual(index * sector - 0.01);
        expect(angle).toBeLessThanOrEqual((index + 1) * sector + 0.01);
      });
    }
  });

  it("is deterministic for the same random source", () => {
    expect(bubbleGeometry(seeded(7))).toEqual(bubbleGeometry(seeded(7)));
  });
});
