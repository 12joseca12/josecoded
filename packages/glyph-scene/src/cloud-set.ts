import { cloudChipBrain, cloudPhone, cloudWeb } from './clouds';
import { CHARS } from './glyphs';
import { mulberry32 } from './rng';

/** Everything the scene needs per particle, computed off the main thread and transferred. */
export type CloudSet = {
  n: number;
  t0: Float32Array;
  t1: Float32Array;
  t2: Float32Array;
  /** Chip trace metadata (kind 1 = trace, param = position along it). */
  kind: Float32Array;
  param: Float32Array;
  aSeed: Float32Array;
  aGlyph: Float32Array;
  aCol: Float32Array;
};

export type CloudRequest = { type: 'clouds'; id: number; n: number; seed: number };
export type CloudReply =
  | { type: 'clouds'; id: number; set: CloudSet }
  | { type: 'error'; id: number; message: string };

/** The attribute stream is independent from the clouds' one, so adding a shape never reshuffles the glyphs. */
const ATTR_SALT = 0x9e3779b9;

/**
 * The cloud set as a sequence of steps: one `yield` per chunk of work. A worker drains it at once;
 * without Worker the loader runs one step per idle callback. Each cloud uses a fresh `mulberry32(seed)`,
 * the same sampling `paramsHash` fingerprints.
 */
export function* cloudSetSteps(n: number, seed: number): Generator<void, CloudSet, void> {
  const t0 = cloudPhone(n, mulberry32(seed));
  yield;
  const t1 = cloudWeb(n, mulberry32(seed));
  yield;
  const chip = cloudChipBrain(n, mulberry32(seed));
  yield;
  const rng = mulberry32(seed + ATTR_SALT);
  const aSeed = new Float32Array(n);
  const aGlyph = new Float32Array(n);
  const aCol = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    aSeed[i] = rng();
    aGlyph[i] = Math.floor(rng() * CHARS.length);
    aCol[i] = rng();
  }
  return { n, t0, t1, t2: chip.positions, kind: chip.meta.kind, param: chip.meta.param, aSeed, aGlyph, aCol };
}

export function computeCloudSet(n: number, seed: number): CloudSet {
  const it = cloudSetSteps(n, seed);
  for (;;) {
    const r = it.next();
    if (r.done) return r.value;
  }
}

export function transferables(set: CloudSet): ArrayBuffer[] {
  return [set.t0, set.t1, set.t2, set.kind, set.param, set.aSeed, set.aGlyph, set.aCol].map(
    (a) => a.buffer as ArrayBuffer,
  );
}

/** Worker-side request handler, kept pure so the message protocol is testable without a Worker. */
export function handleCloudRequest(req: CloudRequest): { reply: CloudReply; transfer: ArrayBuffer[] } {
  try {
    const set = computeCloudSet(req.n, req.seed);
    return { reply: { type: 'clouds', id: req.id, set }, transfer: transferables(set) };
  } catch (e) {
    return {
      reply: { type: 'error', id: req.id, message: e instanceof Error ? e.message : String(e) },
      transfer: [],
    };
  }
}
