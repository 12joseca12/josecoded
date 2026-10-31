'use client';

import { useEffect } from 'react';

import { decideHeroMode, readHeroContext } from '@/lib/motion/hero-gate';
import {
  INTRO_DONE_EVENT,
  INTRO_START_EVENT,
  SCENE_READY_EVENT,
  runIntro,
} from '@/lib/motion/intro-fall';

import type { IntroHandle, IntroResult, IntroStart } from '@/lib/motion/intro-fall';

/**
 * Island without markup: when the gate marked the page `pending`, runs the intro over the
 * `[data-intro-root]` letters (the hero) and announces it with window events (`intro:start` with
 * `{ t0, sceneReady }`, `intro:done` with the result) for the glyph scene and analytics.
 * `awaitScene`: the scene mode of the hero; the letters then wait for `scene:ready` (at most the
 * token `--dur-intro-scene-wait`). Without it (phones, video, poster) the letters fall alone.
 * `'auto'` asks the hero gate in the browser (the page is static, so it cannot know the device).
 */
export function IntroFall({ awaitScene = false }: { awaitScene?: boolean | 'auto' }) {
  useEffect(() => {
    if (document.documentElement.dataset.intro !== 'pending') return;
    const root = document.querySelector<HTMLElement>('[data-intro-root]') ?? document.body;
    // the listener goes away with the effect, so a remount never leaves a stale one behind
    const listener = new AbortController();
    const waitForScene =
      awaitScene === 'auto' ? decideHeroMode(readHeroContext()) === 'scene' : awaitScene;
    const sceneReady = waitForScene
      ? new Promise<Event>((resolve) =>
          window.addEventListener(SCENE_READY_EVENT, resolve, {
            once: true,
            signal: listener.signal,
          }),
        )
      : undefined;
    let run: IntroHandle | undefined;
    const play = () => {
      run = runIntro({
        root,
        sceneReady,
        onStart: (start) =>
          window.dispatchEvent(new CustomEvent<IntroStart>(INTRO_START_EVENT, { detail: start })),
        onDone: (result: IntroResult) =>
          window.dispatchEvent(new CustomEvent<IntroResult>(INTRO_DONE_EVENT, { detail: result })),
      });
    };
    // Waiting for the scene, runIntro itself holds the letters. Alone, it would fall in this very
    // tick and React strict mode (development) would cancel it before the first frame: one tick of
    // delay lets the second effect run replace the first one and the fall plays.
    const timer = sceneReady ? undefined : setTimeout(play, 0);
    if (sceneReady) play();
    // React strict mode runs the effect twice in development: cancel() re-arms the gate only
    // while the letters are still waiting for the scene
    return () => {
      clearTimeout(timer);
      listener.abort();
      run?.cancel();
    };
  }, [awaitScene]);

  return null;
}
