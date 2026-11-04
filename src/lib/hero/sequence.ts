import { phaseIds } from "@/types/hero";

export const phaseCount = phaseIds.length;
export const staticPhase = phaseIds.indexOf("publish");

export interface SequenceState {
  phase: number;
  step: number;
  userPaused: boolean;
  offscreen: boolean;
}

export type SequenceAction =
  | { type: "select"; phase: number }
  | { type: "advance" }
  | { type: "toggle" }
  | { type: "offscreen"; value: boolean };

export type PhaseStatus = "done" | "current" | "upcoming";

export const initialSequence: SequenceState = {
  phase: 0,
  step: 0,
  userPaused: false,
  offscreen: false,
};

export function nextPhase(phase: number): number {
  return (phase + 1) % phaseCount;
}

export function isPhase(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < phaseCount;
}

export function moveTo(state: SequenceState, phase: number): SequenceState {
  if (!isPhase(phase) || phase === state.phase) return state;
  return { ...state, phase, step: state.step + 1 };
}

export function sequenceReducer(state: SequenceState, action: SequenceAction): SequenceState {
  switch (action.type) {
    case "select":
      return moveTo(state, action.phase);
    case "advance":
      return moveTo(state, nextPhase(state.phase));
    case "toggle":
      return { ...state, userPaused: !state.userPaused };
    case "offscreen":
      return state.offscreen === action.value ? state : { ...state, offscreen: action.value };
  }
}

export function phaseStatus(index: number, current: number): PhaseStatus {
  if (index === current) return "current";
  return index < current ? "done" : "upcoming";
}

export interface Environment {
  hidden: boolean;
  reduced: boolean;
}

export function shownPhase(state: SequenceState, environment: Environment): number {
  return environment.reduced ? staticPhase : state.phase;
}

export function isPaused(state: SequenceState, environment: Environment): boolean {
  return state.userPaused || state.offscreen || environment.hidden || environment.reduced;
}

export function parityOf(state: SequenceState): 0 | 1 {
  return state.step % 2 === 0 ? 0 : 1;
}
