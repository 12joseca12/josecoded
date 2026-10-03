import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');

const eslint = new ESLint({
  cwd: repoRoot,
  overrideConfigFile: join(here, '..', 'eslint.config.mjs'),
  ignore: false,
});

async function rules(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: join(repoRoot, filePath) });
  return (result?.messages ?? []).map((m) => m.ruleId ?? `parse:${m.message}`);
}

describe('message catalog modules and non-literal import()', () => {
  it.each([
    ["import es from '../messages/es';", 'apps/web/lib/x.ts'],
    ["import es from '../messages/en';", 'apps/web/lib/x.ts'],
    ["import es from '@/messages/es';", 'apps/web/components/x/x.ts'],
    ["import es from '@/messages/es/home.json';", 'apps/web/components/x/x.ts'],
  ])('rejects %s in %s', async (code, file) => {
    expect(await rules(`${code}\nconsole.log(es);\n`, file)).toContain('no-restricted-imports');
  });

  it('allows the catalog modules inside i18n/', async () => {
    const code = "import es from '../messages/es';\nconsole.log(es);\n";
    expect(await rules(code, 'apps/web/i18n/request.ts')).not.toContain('no-restricted-imports');
  });

  it.each([
    "export const m = () => import('../messages/es');",
    "export const m = () => import('../messages/en');",
  ])('rejects the dynamic form %s outside i18n/', async (code) => {
    expect(await rules(code, 'apps/web/lib/x.ts')).toContain('no-restricted-syntax');
  });

  it('rejects import(variable) and import(`${x}`) outside i18n/ and glyph-scene', async () => {
    const variable = 'export const m = (p: string) => import(p);';
    const template = 'export const m = (p: string) => import(`./${p}`);';
    expect(await rules(variable, 'apps/web/lib/x.ts')).toContain('no-restricted-syntax');
    expect(await rules(template, 'apps/web/lib/x.ts')).toContain('no-restricted-syntax');
  });

  it('allows non-literal import() in i18n/ and in glyph-scene, and any literal one', async () => {
    const variable = 'export const m = (p: string) => import(p);';
    expect(await rules(variable, 'apps/web/i18n/request.ts')).not.toContain('no-restricted-syntax');
    expect(await rules(variable, 'packages/glyph-scene/src/worker.ts')).not.toContain(
      'no-restricted-syntax',
    );
    const literal = "export const m = () => import('./other');";
    expect(await rules(literal, 'apps/web/lib/x.ts')).not.toContain('no-restricted-syntax');
  });
});

describe('the boundaries cannot be silenced with comments', () => {
  it('rejects disabling no-restricted-imports or no-restricted-syntax', async () => {
    const imports =
      "// eslint-disable-next-line no-restricted-imports\nimport * as t from 'three';\nconsole.log(t);\n";
    const syntax =
      '// eslint-disable-next-line no-restricted-syntax\nexport const m = (p: string) => import(p);\n';
    expect(await rules(imports, 'apps/web/lib/x.ts')).toContain(
      '@eslint-community/eslint-comments/no-restricted-disable',
    );
    expect(await rules(syntax, 'apps/web/lib/x.ts')).toContain(
      '@eslint-community/eslint-comments/no-restricted-disable',
    );
  });

  it('rejects a blanket eslint-disable', async () => {
    const code = "/* eslint-disable */\nimport * as t from 'three';\nconsole.log(t);\n";
    expect(await rules(code, 'apps/web/lib/x.ts')).toContain(
      '@eslint-community/eslint-comments/no-unlimited-disable',
    );
  });

  it('reports a disable directive that disables nothing', async () => {
    const code = '// eslint-disable-next-line no-console\nexport const a = 1;\n';
    const ids = await rules(code, 'apps/web/lib/x.ts');
    expect(ids.some((id) => id.startsWith('parse:Unused eslint-disable directive'))).toBe(true);
  });

  it('still allows a justified disable of an unrelated rule that is used', async () => {
    const code =
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nexport const a: any = 1;\n';
    expect(await rules(code, 'apps/web/lib/x.ts')).toEqual([]);
  });
});
