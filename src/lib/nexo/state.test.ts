import { describe, expect, it } from "vitest";

import { nexoEvents, nexoStates } from "@/types/nexo";

import { nexoStateFor } from "./state";

describe("nexoStateFor", () => {
  it.each([
    ["visitor-arrived", "greeting"],
    ["typing", "listening"],
    ["awaiting-reply", "thinking"],
    ["streaming", "talking"],
    ["reply-finished", "idle"],
    ["lead-saved", "happy"],
    ["positive-answer", "happy"],
    ["low-confidence", "thinking"],
    ["error", "sad"],
    ["not-interested", "sad"],
    ["idle-timeout", "idle"],
    ["wake", "idle"],
  ] as const)("%s leads to %s", (event, state) => {
    expect(nexoStateFor(event)).toBe(state);
  });

  it("maps every event to a known state", () => {
    for (const event of nexoEvents) {
      expect(nexoStates).toContain(nexoStateFor(event));
    }
  });

  it("reaches every state from some event", () => {
    const reached = new Set(nexoEvents.map(nexoStateFor));
    expect([...reached].sort()).toEqual([...nexoStates].sort());
  });
});
