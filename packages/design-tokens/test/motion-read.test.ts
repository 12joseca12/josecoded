import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

// lib/motion/ reads tokens only through readToken() (working-agreements §14.4): no direct
// getPropertyValue. Vacuous until apps/web/lib/motion exists (phase 2).
const motionDir = fileURLToPath(new URL('../../../apps/web/lib/motion', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    // tests may assert inline styles the module wrote; the rule is about modules reading tokens
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

it('no motion module reads a custom property directly', () => {
  if (!existsSync(motionDir)) return;
  const offenders = sourceFiles(motionDir).filter((file) =>
    readFileSync(file, 'utf8').includes('getPropertyValue'),
  );
  expect(offenders).toEqual([]);
});
