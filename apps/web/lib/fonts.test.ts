import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, it } from 'vitest';

// The UI copy of Geist Mono is a Latin subset of the variable font the hero media are rendered with. A subset that
// grows back to the full file (or an empty one) defeats it: the full file is 70 KB and is what the LCP path avoids.
it('serves a small, real woff2 subset of Geist Mono', () => {
  const app = readFileSync(resolve(__dirname, 'fonts/GeistMono-Subset.woff2'));
  const full = readFileSync(resolve(__dirname, '../../../packages/glyph-scene/render/GeistMono-Variable.woff2'));
  expect(app.subarray(0, 4).toString('latin1')).toBe('wOF2');
  expect(app.length).toBeGreaterThan(8_000);
  expect(app.length).toBeLessThan(20_000);
  expect(app.length).toBeLessThan(full.length / 3);
});
