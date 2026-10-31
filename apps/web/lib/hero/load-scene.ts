// Scene mode (DT §1.6.2 steps 3-6): the live WebGL hero. The chunk with `three` is a dynamic
// import, so it never reaches the initial bundle; it starts after the LCP (at once on the first
// visit, when the intro hides the letters and there is nothing to protect), the build waits for
// idle, and the canvas fades in over the poster.
//
// The canvas is created here and lives in the Backdrop slot, not inside the hero: `<main>` is a
// stacking context above the light field, and the scene draws opaque, so a canvas inside it would
// bury the field (deviation from DT §1.6.3, which put `<canvas hidden>` in the stage).
import {
  INTRO_DONE_EVENT,
  INTRO_START_EVENT,
  SCENE_READY_EVENT,
} from '@/lib/motion/intro-fall';

import { afterLcp, idle } from './after-lcp';
import { createBarWriter } from './bars';

import type { IntroResult, IntroStart } from '@/lib/motion/intro-fall';
import type { GlyphScene } from '@josecoded/glyph-scene';

export interface HeroSceneElements {
  stage: HTMLElement;
  bars: Element | null;
  /** Backdrop layer that holds the canvas (below the field). */
  canvasSlot: HTMLElement;
  /** Light field the scene moves by `transform`. */
  field: HTMLElement | null;
}

/** If the letters never answer (no IntroFall on the page) the scene must not wait for ever. */
const INTRO_START_CAP_MS = 2000;

const introWaiting = () => ['pending', 'armed'].includes(document.documentElement.dataset.intro ?? '');

function monoFamily(): string | undefined {
  // next/font hashes the family name: its custom property holds the real stack
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-geist-mono').trim();
  return family === '' ? undefined : family;
}

/** Counts the first drag on the stage once per page (Umami is optional; task 2.12 types this). */
function trackFirstDrag(stage: HTMLElement, signal: AbortSignal) {
  const onMove = (event: PointerEvent) => {
    if (event.buttons !== 1) return;
    (window as Window & { umami?: { track?: (name: string) => void } }).umami?.track?.('scene_drag');
    stage.removeEventListener('pointermove', onMove);
  };
  stage.addEventListener('pointermove', onMove, { signal });
}

/**
 * Starts the scene. Resolves when it is running (the canvas is fading in) and rejects if the chunk
 * or WebGL fails, so the caller can fall back to the video. The returned `stop` is for an effect
 * cleanup and is safe to call at any point.
 */
export function startScene(el: HeroSceneElements): { ready: Promise<void>; stop: () => void } {
  const abort = new AbortController();
  const { signal } = abort;
  let scene: GlyphScene | undefined;
  let canvas: HTMLCanvasElement | undefined;

  const stop = () => {
    abort.abort();
    scene?.dispose();
    scene = undefined;
    canvas?.remove();
    el.field?.style.removeProperty('transform');
    delete el.stage.dataset.state;
  };

  const ready = (async () => {
    if (!introWaiting()) await afterLcp();
    if (signal.aborted) return;
    performance.mark('scene:import-start');
    const { createGlyphScene } = await import('@josecoded/glyph-scene');
    await idle();
    if (signal.aborted) return;

    canvas = document.createElement('canvas');
    el.canvasSlot.append(canvas);
    const write = createBarWriter(el.bars);
    const fontFamily = monoFamily();
    const created = await createGlyphScene({
      canvas,
      stage: el.stage,
      ...(el.field ? { field: el.field } : null),
      ...(fontFamily ? { fontFamily } : null),
      onProgress: write,
    });
    if (signal.aborted) {
      created.dispose();
      return;
    }
    scene = created;

    const go = () => {
      if (signal.aborted) return;
      created.start();
      if (canvas) canvas.dataset.live = '';
      el.stage.dataset.state = 'live';
    };

    // the letters skip the intro on any gesture: the particles follow
    window.addEventListener(
      INTRO_DONE_EVENT,
      (event) => {
        if ((event as CustomEvent<IntroResult>).detail.skipped) created.skipIntro();
      },
      { signal },
    );
    trackFirstDrag(el.stage, signal);

    if (!introWaiting()) {
      go(); // not the first visit, or the letters already fell on their own: no particle rain
      return;
    }
    // first visit: answer `scene:ready`, and fall together with the letters from the shared t0
    const timer = setTimeout(go, INTRO_START_CAP_MS);
    window.addEventListener(
      INTRO_START_EVENT,
      (event) => {
        clearTimeout(timer);
        const start = (event as CustomEvent<IntroStart>).detail;
        if (start.sceneReady) created.playIntro(start.t0);
        go();
      },
      { once: true, signal },
    );
    signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
    window.dispatchEvent(new Event(SCENE_READY_EVENT));
  })();

  return { ready, stop };
}
