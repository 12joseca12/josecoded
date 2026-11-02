'use client';

import { useEffect, useRef } from 'react';

/**
 * Calls `tick` every `intervalMs` while the tab is visible and `enabled`. A hidden tab stops the timer; coming back
 * calls `tick` at once (what arrived meanwhile) and restarts it. A tick never overlaps the previous one.
 */
export function usePolling(tick: () => Promise<void> | void, { intervalMs, enabled }: { intervalMs: number; enabled: boolean }) {
  const latest = useRef(tick);
  useEffect(() => {
    latest.current = tick;
  });

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let running = false;
    const run = async () => {
      if (running) return;
      running = true;
      try {
        await latest.current();
      } finally {
        running = false;
      }
    };
    const start = () => {
      if (timer === undefined) timer = setInterval(() => void run(), intervalMs);
    };
    const stop = () => {
      clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        void run();
        start();
      }
    };
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, intervalMs]);
}
