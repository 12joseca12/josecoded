/**
 * Browser side of `hero:media`: the real scene in a fixed square stage, driven frame by frame from Playwright.
 * Bundled by esbuild at render time; nothing here ships to the site.
 */
import { createGlyphScene, type GlyphScene, type GlyphSceneDebug, type GlyphSceneOptions } from '../src/index';

export type HarnessInit = Pick<GlyphSceneOptions, 'count' | 'seed' | 'capture' | 'background' | 'params' | 'pose'> & {
  /** Name of the family registered from `fontUrl` (a distinct name proves the atlas honours `fontFamily`). */
  fontName: string;
  fontUrl: string;
  /** CSS px height of the stage, centred in the viewport (default: the whole viewport). The cloud's size follows it. */
  stageHeight?: number;
  /** CSS px the stage is shifted down from the centre. */
  stageOffsetY?: number;
};

export type HarnessApi = {
  init(o: HarnessInit): Promise<{ debug: GlyphSceneDebug; fontLoaded: boolean }>;
  step(dt: number): GlyphSceneDebug;
  /** Steps and reads the canvas in the same task: the drawing buffer is cleared once the task ends. */
  stepPng(dt: number): string;
};

declare global {
  interface Window {
    glyphHarness: HarnessApi;
  }
}

let scene: GlyphScene | null = null;

window.glyphHarness = {
  async init(o) {
    // No worker in the harness: the clouds are computed on this thread (same output, no module-worker setup).
    (globalThis as { Worker?: unknown }).Worker = undefined;
    const { fontName, fontUrl, stageHeight, stageOffsetY = 0, ...rest } = o;
    const face = new FontFace(fontName, `url(${fontUrl})`, { weight: '100 900' });
    document.fonts.add(await face.load());
    const canvas = document.getElementById('scene') as HTMLCanvasElement;
    const stage = document.getElementById('stage') as HTMLElement;
    if (stageHeight) {
      stage.style.inset = 'auto';
      stage.style.width = '100%';
      stage.style.height = `${stageHeight}px`;
      stage.style.top = `${(innerHeight - stageHeight) / 2 + stageOffsetY}px`;
    }
    scene = await createGlyphScene({ canvas, stage, fontFamily: `"${fontName}"`, ...rest });
    // Warm-up render without advancing time: the first composer pass under SwiftShader paints uninitialised bloom targets.
    scene.step(0);
    return { debug: scene.debug(), fontLoaded: document.fonts.check(`500 46px "${fontName}"`) };
  },
  step(dt) {
    if (!scene) throw new Error('harness not initialised');
    scene.step(dt);
    return scene.debug();
  },
  stepPng(dt) {
    if (!scene) throw new Error('harness not initialised');
    scene.step(dt);
    return (document.getElementById('scene') as HTMLCanvasElement).toDataURL('image/png');
  },
};
