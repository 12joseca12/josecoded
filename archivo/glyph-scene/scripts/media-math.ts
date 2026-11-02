/** Pure helpers of `hero:media`, kept free of sharp/ffmpeg so they can be unit tested. */

/** PSNR (dB) between two equally sized 8-bit buffers; `Infinity` when identical. */
export function psnr(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) throw new Error(`psnr: size mismatch (${a.length} vs ${b.length})`);
  let se = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] as number) - (b[i] as number);
    se += d * d;
  }
  const mse = se / a.length;
  return mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
}

/**
 * Additive glow on black (RGB, 3 bytes per pixel) -> straight-alpha RGBA: alpha from the brightest channel (haze
 * below `floor` is cut, scaled by `gain`), colour = glow / alpha, so it looks the same over a dark page.
 */
export function glowToAlpha(rgb: Uint8Array, pixels: number, floor: number, gain: number): Uint8Array {
  const out = new Uint8Array(pixels * 4);
  for (let i = 0; i < pixels; i++) {
    const r = rgb[i * 3] as number;
    const g = rgb[i * 3 + 1] as number;
    const b = rgb[i * 3 + 2] as number;
    const a = Math.min(255, Math.round(Math.max(0, Math.max(r, g, b) - floor) * gain));
    if (a > 0) {
      out[i * 4] = Math.min(255, Math.round((r * 255) / a));
      out[i * 4 + 1] = Math.min(255, Math.round((g * 255) / a));
      out[i * 4 + 2] = Math.min(255, Math.round((b * 255) / a));
    }
    out[i * 4 + 3] = a;
  }
  return out;
}

/** Highest quality (from `start` down by 4) whose encoding fits the limit. */
export async function fit(name: string, encode: (q: number) => Promise<Uint8Array>, start: number, limit: number): Promise<Uint8Array> {
  for (let q = start; q >= 20; q -= 4) {
    const buf = await encode(q);
    if (buf.length <= limit) return buf;
  }
  throw new Error(`${name} does not fit ${limit} bytes even at quality 20`);
}

/** Lowest crf (best quality) in [lo, hi] whose size fits the limit; size grows as crf falls, so a bisection finds it. */
export async function bisect(size: (crf: number) => Promise<number>, lo: number, hi: number, limit: number, onStep?: (crf: number, bytes: number) => void): Promise<number> {
  let best = hi;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const bytes = await size(mid);
    onStep?.(mid, bytes);
    if (bytes <= limit) {
      best = mid;
      hi = mid - 1;
    } else lo = mid + 1;
  }
  if ((await size(best)) > limit) throw new Error(`does not fit ${limit} bytes even at crf ${best}`);
  return best;
}
