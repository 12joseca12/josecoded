'use client';

import { useEffect } from 'react';

import {
  INTRO_DONE_EVENT,
  INTRO_START_EVENT,
  SCENE_READY_EVENT,
  runIntro,
} from '@/lib/motion/intro-fall';

import type { IntroResult } from '@/lib/motion/intro-fall';

/**
 * Island without markup: when the gate marked the page `pending`, runs the intro over the
 * `[data-intro-root]` letters (the hero) and announces it with window events (`intro:start` with the
 * shared `t0`, `intro:done` with the result) for the glyph scene and analytics.
 * `awaitScene`: the scene mode of the hero; the letters then wait for `scene:ready` (at most the
 * token `--dur-intro-scene-wait`). Without it (phones, video, poster) the letters fall alone.
 */
export function IntroFall({ awaitScene = false }: { awaitScene?: boolean }) {
  useEffect(() => {
    if (document.documentElement.dataset.intro !== 'pending') return;
    const root = document.querySelector<HTMLElement>('[data-intro-root]') ?? document.body;
    const sceneReady = awaitScene
      ? new Promise<Event>((resolve) =>
          window.addEventListener(SCENE_READY_EVENT, resolve, { once: true }),
        )
      : undefined;
    const run = runIntro({
      root,
      sceneReady,
      onStart: (t0) => window.dispatchEvent(new CustomEvent<number>(INTRO_START_EVENT, { detail: t0 })),
      onDone: (result: IntroResult) =>
        window.dispatchEvent(new CustomEvent<IntroResult>(INTRO_DONE_EVENT, { detail: result })),
    });
    // React strict mode runs the effect twice in development: cancel() re-arms the gate
    return run.cancel;
  }, [awaitScene]);

  return null;
}
