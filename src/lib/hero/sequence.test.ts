import { describe, expect, it } from "vitest";

import {
  initialSequence,
  isPaused,
  nextPhase,
  parityOf,
  phaseCount,
  phaseStatus,
  sequenceReducer,
  type SequenceState,
  shownPhase,
  staticPhase,
} from "./sequence";

const calm = { hidden: false, reduced: false };

describe("nextPhase", () => {
  it("walks the five phases and wraps to the first", () => {
    expect(phaseCount).toBe(5);
    expect(nextPhase(0)).toBe(1);
    expect(nextPhase(3)).toBe(4);
    expect(nextPhase(4)).toBe(0);
  });
});

describe("sequenceReducer", () => {
  it("advances and counts the step", () => {
    const next = sequenceReducer(initialSequence, { type: "advance" });
    expect(next.phase).toBe(1);
    expect(next.step).toBe(1);
  });

  it("wraps from the last phase to the first", () => {
    const last: SequenceState = { ...initialSequence, phase: 4, step: 4 };
    expect(sequenceReducer(last, { type: "advance" }).phase).toBe(0);
  });

  it("selects a phase directly", () => {
    expect(sequenceReducer(initialSequence, { type: "select", phase: 3 }).phase).toBe(3);
  });

  it("ignores selecting the current or an invalid phase", () => {
    expect(sequenceReducer(initialSequence, { type: "select", phase: 0 })).toBe(initialSequence);
    expect(sequenceReducer(initialSequence, { type: "select", phase: 5 })).toBe(initialSequence);
    expect(sequenceReducer(initialSequence, { type: "select", phase: -1 })).toBe(initialSequence);
    expect(sequenceReducer(initialSequence, { type: "select", phase: 1.5 })).toBe(initialSequence);
  });

  it("toggles the user pause without moving the phase", () => {
    const paused = sequenceReducer(initialSequence, { type: "toggle" });
    expect(paused.userPaused).toBe(true);
    expect(paused.phase).toBe(0);
    expect(sequenceReducer(paused, { type: "toggle" }).userPaused).toBe(false);
  });

  it("tracks off-screen without changing identical state", () => {
    const off = sequenceReducer(initialSequence, { type: "offscreen", value: true });
    expect(off.offscreen).toBe(true);
    expect(sequenceReducer(off, { type: "offscreen", value: true })).toBe(off);
  });
});

describe("parityOf", () => {
  it("flips on every phase change, also when wrapping", () => {
    let state: SequenceState = { ...initialSequence, phase: 4, step: 4 };
    const before = parityOf(state);
    state = sequenceReducer(state, { type: "advance" });
    expect(state.phase).toBe(0);
    expect(parityOf(state)).not.toBe(before);
  });
});

describe("isPaused", () => {
  it("runs when nothing stops it", () => {
    expect(isPaused(initialSequence, calm)).toBe(false);
  });

  it("pauses for the user, off-screen, a hidden tab or reduced motion", () => {
    expect(isPaused({ ...initialSequence, userPaused: true }, calm)).toBe(true);
    expect(isPaused({ ...initialSequence, offscreen: true }, calm)).toBe(true);
    expect(isPaused(initialSequence, { hidden: true, reduced: false })).toBe(true);
    expect(isPaused(initialSequence, { hidden: false, reduced: true })).toBe(true);
  });
});

describe("shownPhase", () => {
  it("shows the live phase normally and Publicar with reduced motion", () => {
    const state: SequenceState = { ...initialSequence, phase: 1 };
    expect(shownPhase(state, calm)).toBe(1);
    expect(shownPhase(state, { hidden: false, reduced: true })).toBe(staticPhase);
    expect(staticPhase).toBe(3);
  });
});

describe("phaseStatus", () => {
  it("marks done, current and upcoming", () => {
    expect(phaseStatus(0, 2)).toBe("done");
    expect(phaseStatus(2, 2)).toBe("current");
    expect(phaseStatus(4, 2)).toBe("upcoming");
  });
});
