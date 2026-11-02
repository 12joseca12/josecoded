"use client";

import { useEffect, useState } from "react";

import { activeBlockId, atBottom, probeLine } from "./nav";
import { readBlocks } from "./use-nav-state";

export function useActiveBlock(): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const run = () => {
      setActive(
        activeBlockId(
          readBlocks(),
          probeLine(innerHeight),
          atBottom(scrollY, innerHeight, document.documentElement.scrollHeight),
        ),
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
  }, []);

  return active;
}
