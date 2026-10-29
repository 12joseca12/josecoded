import { clouds } from './clouds';
import { mulberry32 } from './rng';
import { sha256Hex } from './sha256';

/** Scene parameters of the approved v6 hero (ref/home-v6/scene.js:11). `directedMorph` belongs to dead code and is not ported. */
export const PARAMS = {
  hold: 3.5,
  morph: 1.6,
  rot: 0.18,
  size: 16,
  green: 0,
  scatter: 0.6,
  breath: 0.025,
  wperiod: 4,
  wamp: 0.6,
  bloom: 0.22,
  bloomth: 0.72,
  focus: 6.2,
  mirror: 0.35,
} as const;

/** Particle counts: the poster and the live scene use `desktop`; the video is rendered with `video`. */
export const COUNT = { desktop: 9000, video: 5000 } as const;

/** Parameters of the deterministic capture (poster, video, project art); they are part of the freshness hash. */
export const CAPTURE = {
  width: 720,
  height: 720,
  fps: 30,
  frames: 459,
  seed: 1,
  posterFrame: 15,
} as const;

export type HashInputs = {
  params: Record<string, unknown>;
  count: Record<string, unknown>;
  capture: Record<string, unknown>;
  /** Version of `three` from the lockfile (filled in by the media scripts; null while the package does not import it). */
  threeVersion: string | null;
  /** Source text of the modules whose content defines the picture but that this module cannot see (shaders.ts, scene.ts, atlas.ts). */
  sources: readonly string[];
};

/** Behavioural fingerprint of clouds.ts: any change to a shape or to the sampling changes the sample. */
function cloudsDigest(seed: number): string {
  const rng = mulberry32(seed);
  const parts = (Object.keys(clouds) as Array<keyof typeof clouds>).map((k) => {
    const a = clouds[k](256, rng);
    return k + ':' + a.reduce((acc, v) => acc + v.toFixed(5) + ',', '');
  });
  return sha256Hex(parts.join('|'));
}

/**
 * Short sha256 (16 hex) of everything that decides how the hero looks: PARAMS, COUNT, CAPTURE, the clouds
 * (through a digest of their output, equivalent to hashing clouds.ts), the `three` version and, when given,
 * the sources of shaders/scene/atlas. `hero:media` only regenerates when this changes.
 */
export function paramsHash(over: Partial<HashInputs> = {}): string {
  const inputs: HashInputs = {
    params: PARAMS,
    count: COUNT,
    capture: CAPTURE,
    threeVersion: null,
    sources: [],
    ...over,
  };
  const seed = typeof inputs.capture['seed'] === 'number' ? inputs.capture['seed'] : CAPTURE.seed;
  const payload = JSON.stringify({ ...inputs, clouds: cloudsDigest(seed) });
  return sha256Hex(payload).slice(0, 16);
}
