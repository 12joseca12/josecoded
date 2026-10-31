import { GL } from '@josecoded/glyph-scene/glyphs';
import { mulberry32 } from '@josecoded/glyph-scene/rng';

import { readToken } from '@/styles/tokens';

import type { TokenName } from '@/styles/tokens';
import type { Rng } from '@josecoded/glyph-scene/rng';

// Intro of the first visit per session (spec D16, DT §1.6.4; port of ref/home-v7/scene.js:425-481):
// the characters of the hero fall at a constant speed, land with a green flash and settle on their
// final letter. The text is served already split by FallText, so this module never changes the
// structure: it only writes `style.transform`, the classes and the `textContent` of each `.ch`.
// Durations and distances come from tokens (readToken); the PRNG is seeded, so the fall is the same
// in every test and every visit.

/** Fixed seed: the same fall every time (the prototype used Math.random). */
export const INTRO_SEED = 0x1d70;

/** Window events that tie the letters to the glyph scene (task 2.8). */
export const SCENE_READY_EVENT = 'scene:ready';
export const INTRO_START_EVENT = 'intro:start';
export const INTRO_DONE_EVENT = 'intro:done';

export type IntroMode = 'full' | 'letters' | 'none';

export interface IntroResult {
  skipped: boolean;
  reduced: boolean;
  mode: IntroMode;
}

export interface FallPlan {
  el: HTMLElement;
  /** Offset in px above the final place (negative). */
  start: number;
  /** Seconds the character takes to land. */
  landT: number;
  /** Glyph shown while falling. */
  glyph: string;
}

export interface RunIntroOptions {
  /** Container of the `.ch` characters; the one that holds the hero text. */
  root: HTMLElement;
  /** Resolves when the glyph scene can play its own intro; the letters wait for it up to a token. */
  sceneReady?: Promise<unknown>;
  seed?: number;
  /** Called when the fall begins, with the shared `t0` of letters and scene. */
  onStart?: (t0: number) => void;
  onDone: (result: IntroResult) => void;
}

export interface IntroHandle {
  /** Everything lands in the same frame (what a gesture does). */
  finish: () => void;
  /** Stops without reporting and re-arms the gate; for an effect cleanup that will run again. */
  cancel: () => void;
}

/** Events that end the intro at once. */
const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

/** Milliseconds of a duration token; the CSS pipeline may rewrite `140ms` as `.14s`, so both units are read. */
function readMs(name: TokenName): number {
  const raw = readToken(name);
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value) || !/\d(ms|s)$/.test(raw)) throw new Error(`token ${name} is not a duration: "${raw}"`);
  return raw.endsWith('ms') ? value : value * 1000;
}

function readNumber(name: TokenName): number {
  const value = Number.parseFloat(readToken(name));
  if (Number.isNaN(value)) throw new Error(`token ${name} is not a number`);
  return value;
}

function randomGlyph(rng: Rng): string {
  return GL[Math.floor(rng() * GL.length)] ?? '';
}

/**
 * Where each character starts and how long it takes to land. `landT` is in
 * [land-min, land-min + land-span] seconds (0.4 to 1.2 s); `start` is 0.35 to 1.1 viewport heights
 * above the final place.
 */
export function planFall(
  chars: readonly HTMLElement[],
  seed: number | Rng,
  innerHeight: number,
): FallPlan[] {
  const rng = typeof seed === 'number' ? mulberry32(seed) : seed;
  const landMin = readMs('--dur-intro-land-min') / 1000;
  const landSpan = readMs('--dur-intro-land-span') / 1000;
  const startMin = readNumber('--intro-start-min');
  const startSpan = readNumber('--intro-start-span');
  return chars.map((el) => ({
    el,
    start: -(startMin + rng() * startSpan) * innerHeight,
    landT: landMin + rng() * landSpan,
    glyph: randomGlyph(rng),
  }));
}

interface Drop extends FallPlan {
  speed: number;
  y: number;
  landed: boolean;
  /** Seconds of green flash left once landed. */
  flash: number;
}

function settle(el: HTMLElement) {
  el.classList.remove('is-falling', 'is-wet');
  el.style.removeProperty('transform');
  el.textContent = el.dataset.ch ?? '';
}

/**
 * Runs the intro over the `.ch` of `root`. The gate script has set `data-intro="pending"` on
 * `<html>` (letters hidden); this marks it `armed` while it waits for the scene and removes it when
 * the letters are placed, so the 2.5 s safety timeout of the gate cannot reveal them mid-wait.
 */
export function runIntro({
  root,
  sceneReady,
  seed = INTRO_SEED,
  onStart,
  onDone,
}: RunIntroOptions): IntroHandle {
  const html = document.documentElement;
  const chars = [...root.querySelectorAll<HTMLElement>('.ch')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mode: IntroMode = sceneReady ? 'full' : 'letters';
  const abort = new AbortController();
  let drops: Drop[] = [];
  let frame = 0;
  let waitTimer: ReturnType<typeof setTimeout> | undefined;
  let state: 'waiting' | 'falling' | 'done' = 'waiting';
  const scrollStart = window.scrollY;

  function stop() {
    abort.abort();
    cancelAnimationFrame(frame);
    clearTimeout(waitTimer);
  }

  function end(result: IntroResult) {
    if (state === 'done') return;
    state = 'done';
    stop();
    for (const el of chars) settle(el);
    delete html.dataset.intro;
    onDone(result);
  }

  const finish = () => end({ skipped: true, reduced, mode });

  if (reduced || chars.length === 0) {
    end({ skipped: false, reduced, mode: 'none' });
    return { finish, cancel: () => undefined };
  }

  html.dataset.intro = 'armed';

  const onGesture = (event: Event) => {
    // the browser may restore the scroll position after load: only a real movement is a gesture
    if (event.type === 'scroll' && window.scrollY === scrollStart) return;
    finish();
  };
  for (const type of SKIP_EVENTS) {
    window.addEventListener(type, onGesture, { capture: true, passive: true, signal: abort.signal });
  }

  const rng = mulberry32(seed);
  const flashMin = readMs('--dur-intro-flash-min') / 1000;
  const flashSpan = readMs('--dur-intro-flash-span') / 1000;
  const swapChance = readNumber('--intro-glyph-swap');

  function tick(now: number, last: number) {
    const dt = (now - last) / 1000;
    let busy = false;
    for (const d of drops) {
      if (d.landed) {
        if (d.flash > 0) {
          d.flash -= dt;
          if (d.flash <= 0) settle(d.el);
          else busy = true;
        }
        continue;
      }
      busy = true;
      d.y += d.speed * dt;
      if (d.y >= 0) {
        d.landed = true;
        d.flash = flashMin + rng() * flashSpan;
        d.el.classList.replace('is-falling', 'is-wet');
        d.el.style.removeProperty('transform');
        d.el.textContent = randomGlyph(rng);
      } else {
        d.el.style.transform = `translateY(${d.y}px)`;
        if (rng() < swapChance) d.el.textContent = randomGlyph(rng);
      }
    }
    if (!busy) {
      end({ skipped: false, reduced, mode });
      return;
    }
    frame = requestAnimationFrame((next) => tick(next, now));
  }

  function begin() {
    if (state !== 'waiting') return;
    state = 'falling';
    clearTimeout(waitTimer);
    drops = planFall(chars, rng, window.innerHeight).map((plan) => ({
      ...plan,
      speed: -plan.start / plan.landT,
      y: plan.start,
      landed: false,
      flash: 0,
    }));
    for (const d of drops) {
      d.el.classList.add('is-falling');
      d.el.style.transform = `translateY(${d.start}px)`;
      d.el.textContent = d.glyph;
    }
    delete html.dataset.intro;
    const t0 = performance.now();
    onStart?.(t0);
    frame = requestAnimationFrame((now) => tick(now, t0));
  }

  if (sceneReady) {
    waitTimer = setTimeout(begin, readMs('--dur-intro-scene-wait'));
    void sceneReady.then(begin, begin);
  } else {
    begin();
  }

  return {
    finish,
    cancel() {
      if (state === 'done') return;
      state = 'done';
      stop();
      for (const el of chars) settle(el);
      html.dataset.intro = 'pending';
    },
  };
}
