import type { Clock } from '@josecoded/types';

export interface FakeClock extends Clock {
  /** Moves the clock forward (negative values move it back). */
  advance(ms: number): void;
  set(date: Date | string): void;
}

/** In-memory Clock (working-agreements §17.1): same port as the real one, frozen until told otherwise. */
export function createFakeClock(start: Date | string = '2026-01-01T00:00:00.000Z'): FakeClock {
  let current = new Date(start).getTime();
  return {
    now: () => new Date(current),
    advance: (ms) => {
      current += ms;
    },
    set: (date) => {
      current = new Date(date).getTime();
    },
  };
}
