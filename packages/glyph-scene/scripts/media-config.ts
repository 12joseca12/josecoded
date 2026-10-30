import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CAPTURE, paramsHash } from '../src/params';

/** Package root (the run-ts launcher sets the variable; tests and tools fall back to this file's place). */
export const ROOT = process.env['GLYPH_SCENE_ROOT'] ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC_DIR = resolve(ROOT, '../../apps/web/public');
export const MANIFEST_PATH = join(PUBLIC_DIR, 'hero/media.json');
export const FONT_FILE = join(ROOT, 'node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2');

/**
 * Project art: still frames of the phone and web states, 801x722 like the prototype's `glyph-*-alpha.png`
 * (which are live-loop stills: the cloud turned by the 0.18 rad/s drift, phone at ~3.3 s, web at ~6.3 s).
 * The page is rendered 100 px wider (>= 56.25rem, the desktop look: full brightness and reflection) and cropped.
 */
export const ART = {
  width: 801,
  height: 722,
  viewportWidth: 901,
  /** Stage height and downward shift in CSS px (the cloud's size and position follow the stage). */
  stage: { height: 640, offsetY: 20 },
  /** Alpha from the additive glow on black: `alpha = (max(r,g,b) - floor) * gain`, colour = glow / alpha (same look over a dark page). */
  alpha: { floor: 6, gain: 2 },
  /** Turn of the cloud in radians and the `step(dt)` calls that bring the scene to each state's hold (web: after the morph). */
  phone: { rotY: 0.6, steps: [2] },
  web: { rotY: 1.13, steps: [3.5, 1.6, 1.5] },
} as const;

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** The `three` version actually installed (the lockfile pins it). */
export function threeVersion(): string {
  return (JSON.parse(read('node_modules/three/package.json')) as { version: string }).version;
}

/** Digest of the font file: a different Geist Mono changes every glyph of the atlas. */
export const fontDigest = (): string => createHash('sha256').update(readFileSync(FONT_FILE)).digest('hex');

/**
 * `paramsHash` with everything the media depend on: the scene sources, the glyph set, the capture harness,
 * the font file, the `three` version and the art geometry. Any change regenerates the media.
 */
export function mediaHash(): string {
  const sources = [
    'src/shaders.ts',
    'src/scene.ts',
    'src/atlas.ts',
    'src/cloud-set.ts',
    'src/cycle.ts',
    'src/glyphs.ts',
    'render/harness.ts',
    'render/index.html',
  ].map(read);
  sources.push(`font:${fontDigest()}`);
  return paramsHash({ threeVersion: threeVersion(), sources, capture: { ...CAPTURE, art: ART } });
}
