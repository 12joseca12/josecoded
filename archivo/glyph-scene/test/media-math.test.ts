import { expect, it } from 'vitest';

import { bisect, fit, glowToAlpha, psnr } from '../scripts/media-math';

it('psnr is Infinity for identical buffers and 10*log10(255^2/mse) otherwise', () => {
  const a = Uint8Array.from([0, 10, 20, 30]);
  expect(psnr(a, a)).toBe(Infinity);
  // every sample off by 1 -> mse 1 -> 48.13 dB
  expect(psnr(a, Uint8Array.from([1, 11, 21, 31]))).toBeCloseTo(10 * Math.log10(255 * 255), 6);
  expect(() => psnr(a, new Uint8Array(3))).toThrow(/size mismatch/);
});

it('glowToAlpha cuts the haze below the floor, scales the rest and un-premultiplies the colour', () => {
  // pixel 0 under the floor, pixel 1: max 106 -> alpha (106-6)*2 = 200, pixel 2 saturates alpha
  const rgb = Uint8Array.from([4, 2, 6, 106, 53, 0, 255, 255, 255]);
  const out = glowToAlpha(rgb, 3, 6, 2);
  expect(Array.from(out.slice(0, 4))).toEqual([0, 0, 0, 0]);
  expect(Array.from(out.slice(4, 8))).toEqual([Math.round((106 * 255) / 200), Math.round((53 * 255) / 200), 0, 200]);
  expect(Array.from(out.slice(8, 12))).toEqual([255, 255, 255, 255]);
});

it('fit returns the first encoding that fits, stepping the quality down by 4, and throws below 20', async () => {
  const tried: number[] = [];
  const encode = async (q: number) => {
    tried.push(q);
    return new Uint8Array(q * 10);
  };
  expect((await fit('x', encode, 60, 500)).length).toBe(480);
  expect(tried).toEqual([60, 56, 52, 48]);
  await expect(fit('x', async () => new Uint8Array(10), 60, 5)).rejects.toThrow(/does not fit 5 bytes/);
});

it('bisect finds the lowest crf that fits, assuming size falls as crf rises', async () => {
  const size = async (crf: number) => (64 - crf) * 100;
  expect(await bisect(size, 20, 63, 2500)).toBe(39);
  expect(await bisect(size, 20, 63, 100_000)).toBe(20);
  await expect(bisect(size, 20, 40, 10)).rejects.toThrow(/does not fit/);
});
