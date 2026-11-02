/** Scene side of the intro: only `uIntroT` (the falling letters live in apps/web, DT 1.6.4). */
export const INTRO_DONE = 100;
export const INTRO_LENGTH = 3;
/** The cloud keeps its first state until the intro has run this long (scene.js `advance`). */
export const INTRO_HOLD_UNTIL = 1.5;

export type Intro = { t: number; t0: number | null };

export const createIntro = (): Intro => ({ t: INTRO_DONE, t0: null });

export const introActive = (i: Intro): boolean => i.t < INTRO_DONE;

/** Start at `t0` (a DOMHighResTimeStamp shared with the letters); `uIntroT` is 0 right away. */
export function playIntro(i: Intro, t0: number): void {
  i.t = 0;
  i.t0 = t0;
}

export function skipIntro(i: Intro): void {
  i.t = INTRO_DONE;
  i.t0 = null;
}

/** Live frames pass `nowMs` (clock shared with the letters); steps without it advance by `dt`. */
export function advanceIntro(i: Intro, dt: number, nowMs?: number): void {
  if (!introActive(i)) return;
  i.t = nowMs !== undefined && i.t0 !== null ? Math.max(0, (nowMs - i.t0) / 1000) : i.t + dt;
  if (i.t >= INTRO_LENGTH) skipIntro(i);
}
