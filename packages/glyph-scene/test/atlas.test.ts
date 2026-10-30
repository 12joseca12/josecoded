// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest';

import { DEFAULT_ATLAS_FAMILY, drawAtlas, loadAtlasFont } from '../src/atlas';
import { CHARS } from '../src/glyphs';

function fakeCanvas() {
  const ctx = { font: '', textAlign: '', textBaseline: '', fillStyle: '', fillText: vi.fn() };
  return { ctx, canvas: { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement };
}

it('paints the atlas with Geist Mono by default and with the computed family when given (next/font hashes the name)', () => {
  const a = fakeCanvas();
  drawAtlas(a.canvas);
  expect(a.ctx.font).toBe(`500 46px ${DEFAULT_ATLAS_FAMILY}, ui-monospace, monospace`);
  expect(DEFAULT_ATLAS_FAMILY).toBe('"Geist Mono"');
  const b = fakeCanvas();
  drawAtlas(b.canvas, "'__Geist_Mono_5ec5f4', '__Geist_Mono_Fallback_5ec5f4'");
  expect(b.ctx.font).toBe("500 46px '__Geist_Mono_5ec5f4', '__Geist_Mono_Fallback_5ec5f4', ui-monospace, monospace");
  expect(b.ctx.fillText).toHaveBeenCalledTimes(CHARS.length);
});

it('waits for the family it was given before painting', async () => {
  const load = vi.fn(() => Promise.resolve([]));
  vi.stubGlobal('document', { ...document, fonts: { load } });
  await loadAtlasFont("'__Geist_Mono_5ec5f4'");
  expect(load).toHaveBeenCalledWith("500 46px '__Geist_Mono_5ec5f4'");
  vi.unstubAllGlobals();
});
