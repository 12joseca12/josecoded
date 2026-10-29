import { clouds } from './clouds';
import { mulberry32 } from './rng';
import { sha256Hex } from './sha256';

/** Scene parameters of the approved v6 hero (ref/home-v6/scene.js:11). `directedMorph` belongs to dead code and is not ported. */
export type Params = {
  hold: number;
  morph: number;
  rot: number;
  size: number;
  green: number;
  scatter: number;
  breath: number;
  wperiod: number;
  wamp: number;
  bloom: number;
  bloomth: number;
  focus: number;
  mirror: number;
};

export const PARAMS: Params = {
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
};

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

/**
 * Inputs of `paramsHash`. `threeVersion` and `sources` are optional here, but the task 2.6 scripts (hero:media,
 * hero:media:check) MUST pass them: the plan requires shaders/scene/atlas/cloud-set/cycle sources and the `three` version in the hash.
 */
export type HashInputs = {
  params: Record<string, unknown>;
  count: Record<string, unknown>;
  capture: Record<string, unknown>;
  /** Version of `three` from the lockfile (filled in by the media scripts; null while the package does not import it). */
  threeVersion: string | null;
  /** Source text of the modules whose content defines the picture but that this module cannot see (shaders.ts, scene.ts, atlas.ts, cloud-set.ts, cycle.ts). */
  sources: readonly string[];
};

type CloudFn = (n: number, rng: () => number) => Float32Array;

/**
 * Behavioural fingerprint of clouds.ts: every cloud is sampled with the real capture counts
 * (`COUNT.desktop` and `COUNT.video`) and the capture seed, so any change to a shape or to the sampling that
 * alters a particle of the poster or the video changes the digest. `cloudMap` is injectable for tests.
 */
export function cloudsDigest(seed: number, cloudMap: Record<string, CloudFn> = clouds): string {
  const parts: string[] = [];
  for (const k of Object.keys(cloudMap)) {
    for (const n of [COUNT.desktop, COUNT.video]) {
      const a = (cloudMap[k] as CloudFn)(n, mulberry32(seed));
      parts.push(k + ':' + n + ':' + sha256Hex(Array.from(a, (v) => v.toFixed(6)).join(',')));
    }
  }
  return sha256Hex(parts.join('|'));
}

/**
 * Short sha256 (16 hex) of everything that decides how the hero looks: PARAMS, COUNT, CAPTURE, the clouds
 * (through a digest of their output at the real capture counts, equivalent to hashing clouds.ts), the `three` version and, when given,
 * the sources of shaders/scene/atlas/cloud-set/cycle. `hero:media` only regenerates when this changes.
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
