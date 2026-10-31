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
 * in `poster`: nothing is downloaded. A WebGL context lost after the start also falls back to the
 * video (the same fallback as a desktop without WebGL2; if the video cannot play, the poster is
 * what stays). `three` is only ever reached by `import()` from here.
 */
export function HeroSceneGate({ sources }: { sources: HeroGateSources }) {
  // primitives, so a new `sources` object on every render does not restart the media
  const { webm, mp4 } = sources;
  useEffect(() => {
    const stage = document.querySelector<HTMLElement>('[data-hero-stage]');
    if (!stage) return;
    stage.dataset.armed = ''; // tells the pre-paint script that the page JavaScript is alive
    // the poster is not shown (nor downloaded) on a desktop expecting the scene: bring it back
    // whenever the scene is not what runs
    const restorePoster = () => stage.querySelector('[data-poster-placeholder]')?.remove();
    const bars = stage.querySelector('[data-hero-bars]');
    const mode: HeroMode = decideHeroMode(readHeroContext());
    stage.dataset.mode = mode;

    let stopVideo: (() => void) | undefined;
    const video = stage.querySelector('video');
    const runVideo = () => {
      restorePoster();
      if (!video) {
        stage.dataset.mode = 'poster'; // nothing to play: the poster is what stays
        return;
      }
      stage.dataset.mode = 'video';
      stopVideo = startVideo({ stage, video, bars }, { webm, mp4 });
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
          // a context lost after start: the scene is already disposed, the video takes over
          onContextLost: () => {
            stopScene = undefined;
            runVideo();
          },
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
    } else {
      restorePoster();
    }

    return () => {
      stopScene?.();
      stopVideo?.();
      delete stage.dataset.mode;
    };
  }, [webm, mp4]);

  return null;
}
