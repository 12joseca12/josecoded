'use client';

import { useEffect } from 'react';

import { startScene } from '@/lib/hero/load-scene';
import { startVideo } from '@/lib/hero/load-video';
import { decideHeroMode, readHeroContext } from '@/lib/motion/hero-gate';

import type { HeroMode } from '@/lib/motion/hero-gate';

/** Where the hero's media are served from (`heroMedia`), as the server renders them. */
export interface HeroGateSources {
  webm: string;
  mp4: string;
}

/**
 * Island without markup (DT §1.6.2 step 2): decides the stage of the hero with the UX v4.0 §4.1
 * table and starts it. The decision lands on the stage as `data-mode` (CSS shows the video or
 * keeps the poster); `data-state="live"` marks the moment the poster gives way. In `scene` mode a
 * failure (no chunk, no WebGL context) falls back to the video. Reduced motion and Save-Data end
 * in `poster`: nothing is downloaded. `three` is only ever reached by `import()` from here.
 */
export function HeroSceneGate({ sources }: { sources: HeroGateSources }) {
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('[data-hero-stage]');
    if (!stage) return;
    const bars = stage.querySelector('[data-hero-bars]');
    const mode: HeroMode = decideHeroMode(readHeroContext());
    stage.dataset.mode = mode;

    let stopVideo: (() => void) | undefined;
    const video = stage.querySelector('video');
    const runVideo = () => {
      if (!video) return;
      stage.dataset.mode = 'video';
      stopVideo = startVideo({ stage, video, bars }, sources);
    };

    let stopScene: (() => void) | undefined;
    if (mode === 'scene') {
      const canvasSlot = document.querySelector<HTMLElement>('[data-backdrop-canvas]');
      if (canvasSlot) {
        const run = startScene({
          stage,
          bars,
          canvasSlot,
          field: document.querySelector<HTMLElement>('[data-backdrop-field]'),
        });
        stopScene = run.stop;
        run.ready.catch(() => {
          run.stop();
          stopScene = undefined;
          runVideo();
        });
      } else {
        runVideo();
      }
    } else if (mode === 'video') {
      runVideo();
    }

    return () => {
      stopScene?.();
      stopVideo?.();
      delete stage.dataset.mode;
    };
  }, [sources]);

  return null;
}
