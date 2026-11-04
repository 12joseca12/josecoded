"use client";

import { type RefObject, useCallback, useEffect, useReducer, useSyncExternalStore } from "react";

import { initialSequence, isPaused, parityOf, sequenceReducer, shownPhase } from "./sequence";

const reducedQuery = "(prefers-reduced-motion: reduce)";
const visibleRatio = 0.15;

function subscribeReduced(notify: () => void) {
  const query = matchMedia(reducedQuery);
  query.addEventListener("change", notify);
  return () => {
    query.removeEventListener("change", notify);
  };
}

function subscribeHidden(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => {
    document.removeEventListener("visibilitychange", notify);
  };
}

const subscribeNothing = () => () => undefined;
const readReduced = () => matchMedia(reducedQuery).matches;
const readHidden = () => document.hidden;
const readTrue = () => true;
const readFalse = () => false;

export interface HeroSequence {
  phase: number;
  parity: 0 | 1;
  paused: boolean;
  userPaused: boolean;
  reduced: boolean;
  live: boolean;
  select: (phase: number) => void;
  advance: () => void;
  toggle: () => void;
}

export function useHeroSequence(stageRef: RefObject<HTMLDivElement | null>): HeroSequence {
  const [state, dispatch] = useReducer(sequenceReducer, initialSequence);
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, readFalse);
  const hidden = useSyncExternalStore(subscribeHidden, readHidden, readFalse);
  const hydrated = useSyncExternalStore(subscribeNothing, readTrue, readFalse);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) dispatch({ type: "offscreen", value: !entry.isIntersecting });
      },
      { threshold: visibleRatio },
    );
    observer.observe(stage);
    return () => {
      observer.disconnect();
    };
  }, [stageRef]);

  const select = useCallback((phase: number) => {
    dispatch({ type: "select", phase });
  }, []);
  const advance = useCallback(() => {
    dispatch({ type: "advance" });
  }, []);
  const toggle = useCallback(() => {
    dispatch({ type: "toggle" });
  }, []);

  const environment = { hidden, reduced };
  return {
    phase: shownPhase(state, environment),
    parity: parityOf(state),
    paused: isPaused(state, environment),
    userPaused: state.userPaused,
    reduced,
    live: hydrated && !reduced,
    select,
    advance,
    toggle,
  };
}
