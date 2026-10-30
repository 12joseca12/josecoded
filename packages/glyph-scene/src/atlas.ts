import { CanvasTexture, LinearMipmapLinearFilter } from 'three';

import { CHARS } from './glyphs';

export const ATLAS = { cols: 16, rows: 8, cell: 64 } as const;
/**
 * DT 1.6.2: `500 46px` Geist Mono with a system monospace fallback. `family` is a CSS `font-family` value:
 * next/font hashes the family name in the app (`'__Geist_Mono_abc123'`), so the host passes the computed one.
 */
export const DEFAULT_ATLAS_FAMILY = '"Geist Mono"';
const font = (family: string) => `500 46px ${family}`;

/** Waits for the atlas font before painting; if it cannot load, the fallback stack paints instead. */
export async function loadAtlasFont(family: string = DEFAULT_ATLAS_FAMILY): Promise<void> {
  try {
    await document.fonts.load(font(family));
  } catch {
    // ui-monospace fallback
  }
}

export function drawAtlas(canvas: HTMLCanvasElement, family: string = DEFAULT_ATLAS_FAMILY): void {
  const { cols, rows, cell } = ATLAS;
  canvas.width = cols * cell;
  canvas.height = rows * cell;
  const x = canvas.getContext('2d');
  if (!x) return;
  x.font = `${font(family)}, ui-monospace, monospace`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = '#fff';
  for (let i = 0; i < CHARS.length; i++) {
    x.fillText(CHARS[i] as string, (i % cols) * cell + cell / 2, Math.floor(i / cols) * cell + cell / 2 + 2);
  }
}

export async function createAtlasTexture(family: string = DEFAULT_ATLAS_FAMILY): Promise<CanvasTexture> {
  await loadAtlasFont(family);
  const c = document.createElement('canvas');
  drawAtlas(c, family);
  const t = new CanvasTexture(c);
  t.minFilter = LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  return t;
}
