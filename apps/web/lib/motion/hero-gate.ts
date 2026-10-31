// Which of the three stages the hero shows (UX v4.0 §4.1, DT §1.6.2 step 2):
//   scene  live WebGL, desktop and large tablets (>= 56.25rem, deviation accepted by Jose, decision 28)
//   video  every phone and small tablet, and any desktop that cannot or should not run WebGL
//   poster reduced motion and Save-Data (nothing is downloaded), and no JavaScript at all
// Pure on purpose: `readHeroContext` is the only function that touches the browser.

export type HeroMode = 'scene' | 'video' | 'poster';

export interface HeroContext {
  webgl2: boolean;
  /** viewport >= `bp.compact` (56.25rem) */
  desktop: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** GB reported by the browser; unknown counts as plenty (Safari and Firefox do not expose it) */
  deviceMemory: number;
}

/** Below this the device is too small for the live scene (DT §1.6.2). */
const MIN_SCENE_MEMORY_GB = 4;

export function decideHeroMode(ctx: HeroContext): HeroMode {
  if (ctx.reducedMotion || ctx.saveData) return 'poster';
  if (ctx.webgl2 && ctx.desktop && ctx.deviceMemory >= MIN_SCENE_MEMORY_GB) return 'scene';
  return 'video';
}

/** Test context: a throwaway canvas, released at once so it does not count against the context limit. */
function hasWebGL2(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return gl !== null;
  } catch {
    return false;
  }
}

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export function readHeroContext(): HeroContext {
  const hints = navigator as Navigator & NavigatorHints;
  return {
    webgl2: hasWebGL2(),
    desktop: matchMedia('(min-width: 56.25rem)').matches,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: hints.connection?.saveData === true,
    deviceMemory: hints.deviceMemory ?? 8,
  };
}
