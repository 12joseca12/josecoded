/** Hold/morph state machine of the three-state cycle PHONE -> WEB -> CHIP (scene.js `advance`, without the directed branch). */
export const PHONE = 0;
export const WEB = 1;
export const CHIP = 2;
export type StateIndex = 0 | 1 | 2;

export type Cycle = {
  state: StateIndex;
  next: StateIndex;
  phase: 'hold' | 'morph';
  /** Seconds in the current phase. */
  pt: number;
  /** Morph progress 0..1 (the `uProg` uniform). */
  prog: number;
};

export const createCycle = (): Cycle => ({ state: PHONE, next: WEB, phase: 'hold', pt: 0, prog: 0 });

/** Absorbs float error of accumulated fixed steps (105 x 1/30 may land at 3.4999999). */
const EPS = 1e-9;

const after = (s: StateIndex): StateIndex => ((s + 1) % 3) as StateIndex;

/** Index the cycle bars highlight: the next state once the morph is past half. */
export const cycleIndex = (c: Cycle): StateIndex => (c.phase === 'hold' ? c.state : c.prog > 0.5 ? c.next : c.state);

/** Fill of the current bar: the hold fills it, a morph keeps it full. */
export const cycleFill = (c: Cycle, hold: number): number => (c.phase === 'hold' ? Math.min(1, c.pt / hold) : 1);

export function advanceCycle(c: Cycle, dt: number, p: { hold: number; morph: number }, waiting: boolean): void {
  if (waiting) {
    c.pt = 0;
    return;
  }
  c.pt += dt;
  let f = 0;
  if (c.phase === 'hold') {
    if (c.pt >= p.hold - EPS) {
      c.next = after(c.state);
      c.phase = 'morph';
      c.pt = Math.max(0, c.pt - p.hold); // carry the remainder so fixed-dt loops do not drift
    }
  } else {
    f = Math.min(1, c.pt / p.morph);
    if (f >= 1 - EPS) {
      c.state = c.next;
      c.phase = 'hold';
      c.pt = Math.max(0, c.pt - p.morph);
      f = 0;
    }
  }
  c.prog = f;
}
