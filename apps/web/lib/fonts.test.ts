import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, it } from 'vitest';

it('the app and the hero media render with the same Geist Mono bytes', () => {
  const app = readFileSync(resolve(__dirname, 'fonts/GeistMono-Variable.woff2'));
  const media = readFileSync(resolve(__dirname, '../../../packages/glyph-scene/render/GeistMono-Variable.woff2'));
  expect(app.equals(media)).toBe(true);
});
