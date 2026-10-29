import { CanvasTexture, LinearMipmapLinearFilter } from 'three';

import { CHARS } from './glyphs';

export const ATLAS = { cols: 16, rows: 8, cell: 64 } as const;
/** DT 1.6.2: `500 46px "Geist Mono"` with a system monospace fallback. */
const FONT = '500 46px "Geist Mono"';
const FONT_STACK = `${FONT}, ui-monospace, monospace`;

/** Waits for Geist Mono before painting; if the font cannot load, the fallback stack paints instead. */
export async function loadAtlasFont(): Promise<void> {
  try {
    await document.fonts.load(FONT);
  } catch {
    // ui-monospace fallback
  }
}

export function drawAtlas(canvas: HTMLCanvasElement): void {
  const { cols, rows, cell } = ATLAS;
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const x = canvas.getContext('2d');
  if (!x) return;
  x.font = FONT_STACK;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = '#fff';
  for (let i = 0; i < CHARS.length; i++) {
    x.fillText(CHARS[i] as string, (i % cols) * cell + cell / 2, Math.floor(i / cols) * cell + cell / 2 + 2);
  }
}

export async function createAtlasTexture(): Promise<CanvasTexture> {
  await loadAtlasFont();
  const c = document.createElement('canvas');
  drawAtlas(c);
  const t = new CanvasTexture(c);
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}
