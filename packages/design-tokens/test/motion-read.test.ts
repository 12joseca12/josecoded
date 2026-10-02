import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, it } from 'vitest';

// lib/motion/ reads tokens only through readToken() (working-agreements §14.4): no direct
// getPropertyValue. Vacuous until apps/web/lib/motion exists (phase 2).
const motionDir = new URL('../../../apps/web/lib/motion', import.meta.url);

it('no motion module reads a custom property directly', () => {
  if (!existsSync(motionDir)) return;
  const offenders = readdirSync(motionDir)
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) =>
      readFileSync(join(motionDir.pathname, file), 'utf8').includes('getPropertyValue'),
    );
  expect(offenders).toEqual([]);
});
