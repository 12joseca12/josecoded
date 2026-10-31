// Cycle of the hero (PHONE -> WEB -> CHIP): each state holds 3.5 s and morphs for 1.6 s, and the
// bars highlight the next state once the morph is past half. The live scene reports it through
// `onProgress`; the video has no callbacks, so its bars are driven from `currentTime` with this
// pure function (same maths as `cycle.ts` in glyph-scene: the clip loops every 3 x 5.1 s).
import { PARAMS } from '@josecoded/glyph-scene/params';

export interface BarState {
  index: 0 | 1 | 2;
  /** Fill of the highlighted bar, 0..1. */
  fill: number;
}

const STATES = 3;
const LOOP = (PARAMS.hold + PARAMS.morph) * STATES;

export function barsAt(seconds: number): BarState {
  const t = ((seconds % LOOP) + LOOP) % LOOP;
  const slot = PARAMS.hold + PARAMS.morph;
  const state = Math.floor(t / slot) as 0 | 1 | 2;
  const local = t - state * slot;
  if (local < PARAMS.hold) return { index: state, fill: local / PARAMS.hold };
  const morph = (local - PARAMS.hold) / PARAMS.morph;
  return { index: morph > 0.5 ? (((state + 1) % STATES) as 0 | 1 | 2) : state, fill: 1 };
}
