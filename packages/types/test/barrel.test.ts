import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, expectTypeOf, it } from 'vitest';

import type { FormState } from '../src';

const src = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const barrel = readFileSync(join(src, 'index.ts'), 'utf8');
const schemasBarrel = readFileSync(join(src, 'schemas', 'index.ts'), 'utf8');

describe('@josecoded/types barrel', () => {
  const domainFiles = readdirSync(src)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'database.ts')
    .map((f) => f.replace(/\.ts$/, ''));

  it('has the expected domain files', () => {
    expect(domainFiles.sort()).toEqual(['api', 'chat', 'content', 'crm', 'db', 'i18n', 'tokens', 'ui']);
  });

  it.each(domainFiles)('re-exports %s', (name) => {
    expect(barrel).toContain(`export * from './${name}.ts';`);
  });

  it('re-exports the schemas index', () => {
    expect(barrel).toContain("export * from './schemas/index.ts';");
  });

  it('re-exports every schemas/*.ts file from schemas/index.ts', () => {
    const schemaFiles = readdirSync(join(src, 'schemas'))
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'database.ts')
      .map((f) => f.replace(/\.ts$/, ''));
    for (const name of schemaFiles) {
      expect(schemasBarrel).toContain(`export * from './${name}.ts';`);
    }
  });
});

describe('FormState (working-agreements §17.3)', () => {
  it('has the documented shape', () => {
    type Lead = { email: string; name: string };
    expectTypeOf<FormState<Lead>>().toEqualTypeOf<{
      status: 'idle' | 'ok' | 'error';
      fieldErrors?: Partial<Record<keyof Lead, string>>;
      formError?: string;
      values?: Partial<Record<keyof Lead, string>>;
    }>();
  });
});
