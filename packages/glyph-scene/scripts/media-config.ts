import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CAPTURE, paramsHash } from '../src/params';

/** Package root (the run-ts launcher sets the variable; tests and tools fall back to this file's place). */
export const ROOT = process.env['GLYPH_SCENE_ROOT'] ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PUBLIC_DIR = resolve(ROOT, '../../apps/web/public');
export const MANIFEST_PATH = join(PUBLIC_DIR, 'hero/media.json');
/** Vendored Geist Mono (OFL, licence next to it); the app serves a copy of the same file (apps/web/lib/fonts). */
export const FONT_FILE = join(ROOT, 'render/GeistMono-Variable.woff2');

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

/**
 * Everything that produces the media: all of `src/` and `render/` (scene, glyph set, harness, page and the vendored
 * font) plus the scripts that capture, encode and measure. Tests are not inputs. Sorted, so the order is stable.
 */
export function hashedFiles(root = ROOT): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
      const path = `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (!/\.test\.[cm]?[jt]sx?$/.test(entry.name)) out.push(path);
    }
  };
  walk('src');
  walk('render');
  out.push(...MEDIA_SCRIPTS);
  return out.sort();
}

/** Scripts that decide how the media are made (the manifest checkers are not part of it). */
const MEDIA_SCRIPTS = ['scripts/render-media.ts', 'scripts/media-math.ts', 'scripts/media-config.ts', 'scripts/run-ts.mjs'];

/**
 * `paramsHash` with everything the media depend on: the files above (by content, the font included), the `three`
 * version and the art geometry. Any change regenerates the media.
 */
export function mediaHash(root = ROOT): string {
  const sources = hashedFiles(root).map((rel) => `${rel}:${createHash('sha256').update(readFileSync(join(root, rel))).digest('hex')}`);
  return paramsHash({ threeVersion: threeVersion(), sources, capture: { ...CAPTURE, art: ART } });
}
