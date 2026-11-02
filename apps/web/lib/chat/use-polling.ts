'use client';

import { useEffect, useRef } from 'react';

/** What a tick reports: `fail` backs the next call off, `stop` ends the polling for good (until `enabled` toggles). Nothing means success. */
export type PollOutcome = 'ok' | 'fail' | 'stop' | void;

export const POLL_BACKOFF_CAP_MS = 60_000;

/** Delay before the next tick: the interval, doubled after each consecutive failure, capped at 60 s. */
export function nextDelay(intervalMs: number, failures: number): number {
  return Math.min(intervalMs * 2 ** failures, Math.max(POLL_BACKOFF_CAP_MS, intervalMs));
}

/**
 * Calls `tick` every `intervalMs` while the tab is visible and `enabled`. A hidden tab stops the timer; coming back
 * calls `tick` at once (what arrived meanwhile) and restarts it. A tick never overlaps the previous one. A tick that
 * returns `fail` doubles the wait (6 s, 12, 24, 48, 60 cap) until one succeeds; `stop` ends the polling.
 */
export function usePolling(tick: () => Promise<PollOutcome> | PollOutcome, { intervalMs, enabled }: { intervalMs: number; enabled: boolean }) {
  const latest = useRef(tick);
  useEffect(() => {
    latest.current = tick;
  });

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let stopped = false;
    let failures = 0;
    const clear = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const schedule = () => {
      clear();
      if (stopped || document.hidden) return;
      timer = setTimeout(() => void run(), nextDelay(intervalMs, failures));
    };
    const run = async () => {
      if (running || stopped) return;
      running = true;
      let outcome: PollOutcome;
      try {
        outcome = await latest.current();
      } catch {
        outcome = 'fail';
      } finally {
        running = false;
      }
      if (outcome === 'stop') {
        stopped = true;
        clear();
        return;
      }
      failures = outcome === 'fail' ? failures + 1 : 0;
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) {
        clear();
      } else if (!stopped) {
        clear();
        void run();
      }
    };
    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stopped = true;
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, intervalMs]);
}
