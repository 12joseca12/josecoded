import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const barrel = readFileSync(join(src, 'index.ts'), 'utf8');

describe('@josecoded/types barrel', () => {
  const domainFiles = readdirSync(src)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.replace(/\.ts$/, ''));

  it('has the expected domain files', () => {
    expect(domainFiles.sort()).toEqual(['api', 'content', 'db', 'i18n', 'tokens', 'ui']);
  });

  it.each(domainFiles)('re-exports %s', (name) => {
    expect(barrel).toContain(`export * from './${name}';`);
  });

  it('re-exports the schemas index', () => {
    expect(barrel).toContain("export * from './schemas';");
  });
});
