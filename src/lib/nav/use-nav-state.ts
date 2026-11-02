"use client";

import { useEffect, useState } from "react";

import { activeBlockId, atBottom, type BlockBounds, navFlags, probeLine } from "./nav";

export interface NavState {
  scrolled: boolean;
  condensed: boolean;
  section: string | null;
}

const initial: NavState = { scrolled: false, condensed: false, section: null };

export function readBlocks(): BlockBounds[] {
  return [...document.querySelectorAll<HTMLElement>("[data-block][id]")].map((element) => {
    const rect = element.getBoundingClientRect();
    return { id: element.id, top: rect.top, bottom: rect.bottom };
  });
}

function read(trackSections: boolean): NavState {
  const section = trackSections
    ? activeBlockId(
        readBlocks(),
        probeLine(innerHeight),
        atBottom(scrollY, innerHeight, document.documentElement.scrollHeight),
      )
    : null;
  return { ...navFlags(scrollY, innerHeight), section };
}

export function useNavState(trackSections: boolean): NavState {
  const [state, setState] = useState(initial);

  useEffect(() => {
    let frame = 0;
    const run = () => {
      const next = read(trackSections);
      setState((prev) =>
        prev.scrolled === next.scrolled &&
        prev.condensed === next.condensed &&
        prev.section === next.section
          ? prev
          : next,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    };
    schedule();
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", schedule);
      removeEventListener("resize", schedule);
    };
  }, [trackSections]);

  return state;
}
