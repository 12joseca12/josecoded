import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const configFile = join(here, '..', 'eslint.config.mjs');

const eslint = new ESLint({
  cwd: repoRoot,
  overrideConfigFile: configFile,
  // fixtures live under packages/config/test/fixtures, which the shared config ignores
  ignore: false,
});

async function rules(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: join(repoRoot, filePath) });
  return (result?.messages ?? []).map((m) => m.ruleId ?? `parse:${m.message}`);
}

describe('no-restricted-imports (working-agreements 14.5)', () => {
  const forbidden: [string, string, string][] = [
    ['messages JSON', "import es from '../messages/es/home.json';", 'apps/web/components/x/x.ts'],
    [
      'database.ts',
      "import type { Database } from '@josecoded/types/src/database';",
      'apps/web/lib/x.ts',
    ],
    ['tokens.css', "import '../styles/tokens.css';", 'apps/web/components/x/x.ts'],
    ['three outside glyph-scene', "import * as THREE from 'three';", 'apps/web/components/x/x.ts'],
    ['three addons', "import { x } from 'three/addons/postprocessing/x.js';", 'apps/web/lib/x.ts'],
    [
      'supabase-js outside lib/supabase',
      "import { createClient } from '@supabase/supabase-js';",
      'apps/web/components/x/x.ts',
    ],
    [
      'adapter from a route',
      "import { a } from '../../adapters/supabase';",
      'apps/api/src/modules/proposals/proposals.routes.ts',
    ],
  ];

  it.each(forbidden)('rejects %s', async (_label, code, filePath) => {
    expect(await rules(code, filePath)).toContain('no-restricted-imports');
  });

  const allowed: [string, string, string][] = [
    [
      'messages JSON in i18n/request',
      "import es from '../messages/es/home.json';",
      'apps/web/i18n/request.ts',
    ],
    [
      'three in glyph-scene',
      "import * as THREE from 'three';",
      'packages/glyph-scene/src/scene.ts',
    ],
    [
      'supabase-js in lib/supabase',
      "import { createClient } from '@supabase/supabase-js';",
      'apps/web/lib/supabase/server.ts',
    ],
    [
      'supabase-js in gateway adapters',
      "import { createClient } from '@supabase/supabase-js';",
      'apps/api/src/adapters/supabase.ts',
    ],
    ['adapter from deps.ts', "import { a } from './adapters/supabase';", 'apps/api/src/deps.ts'],
  ];

  it.each(allowed)('allows %s', async (_label, code, filePath) => {
    expect(await rules(code, filePath)).not.toContain('no-restricted-imports');
  });
});

describe('generated database.ts', () => {
  const restricted = (ids: string[]) =>
    ids.filter((id) => id === 'no-restricted-imports' || id === 'no-restricted-syntax');

  it('rejects ./database from any packages/types file except db.ts', async () => {
    const code = "import type { Database } from './database';\nexport type D = Database;\n";
    expect(await rules(code, 'packages/types/src/ui.ts')).toContain('no-restricted-imports');
  });

  it('allows ./database from packages/types/src/db.ts', async () => {
    const code = "import type { Database } from './database';\nexport type D = Database;\n";
    expect(restricted(await rules(code, 'packages/types/src/db.ts'))).toEqual([]);
  });

  it('allows ../src/database from the drift test', async () => {
    const code = "import type { Database } from '../src/database';\nexport type D = Database;\n";
    expect(restricted(await rules(code, 'packages/types/test/database-drift.test.ts'))).toEqual([]);
  });

  it('does not flag an unrelated ../lib/database in apps/web', async () => {
    const code = "import { q } from '../lib/database';\nexport const x = q;\n";
    expect(restricted(await rules(code, 'apps/web/components/x/x.ts'))).toEqual([]);
  });

  it('rejects the generated file through the package path from apps/web', async () => {
    const code =
      "import type { Database } from '@josecoded/types/src/database';\nexport type D = Database;\n";
    expect(await rules(code, 'apps/web/lib/x.ts')).toContain('no-restricted-imports');
  });
});

describe('dynamic import() boundaries (no-restricted-syntax)', () => {
  const dynamicForbidden: [string, string, string][] = [
    ['three', "export const m = () => import('three');", 'apps/web/lib/x.ts'],
    ['three addons', "export const m = () => import('three/addons/x.js');", 'apps/web/lib/x.ts'],
    [
      'messages JSON',
      "export const m = () => import('../messages/es/home.json');",
      'apps/web/lib/x.ts',
    ],
    [
      'supabase-js',
      "export const m = () => import('@supabase/supabase-js');",
      'apps/web/components/x.ts',
    ],
  ];

  it('rejects a template-literal import() of messages outside i18n', async () => {
    const code = 'export const m = (l: string) => import(`../messages/${l}.json`);';
    expect(await rules(code, 'apps/web/lib/x.ts')).toContain('no-restricted-syntax');
  });

  it('allows a template-literal import() of messages in i18n/request', async () => {
    const code = 'export const m = (l: string) => import(`../messages/${l}.json`);';
    expect(await rules(code, 'apps/web/i18n/request.ts')).not.toContain('no-restricted-syntax');
  });

  it.each(dynamicForbidden)('rejects import() of %s', async (_label, code, filePath) => {
    expect(await rules(code, filePath)).toContain('no-restricted-syntax');
  });

  const dynamicAllowed: [string, string, string][] = [
    [
      'three in glyph-scene',
      "export const m = () => import('three');",
      'packages/glyph-scene/src/scene.ts',
    ],
    [
      'messages JSON in i18n/request',
      "export const m = () => import('../messages/es/home.json');",
      'apps/web/i18n/request.ts',
    ],
    [
      'supabase-js in lib/supabase',
      "export const m = () => import('@supabase/supabase-js');",
      'apps/web/lib/supabase/x.ts',
    ],
    ['an unrelated module', "export const m = () => import('./three-utils');", 'apps/web/lib/x.ts'],
  ];

  it.each(dynamicAllowed)('allows import() of %s', async (_label, code, filePath) => {
    expect(await rules(code, filePath)).not.toContain('no-restricted-syntax');
  });
});

describe('import-x', () => {
  it('flags wrong import order (relative before external)', async () => {
    const code = "import { a } from './a';\nimport { z } from 'zod';\nconsole.log(a, z);\n";
    expect(await rules(code, 'packages/types/src/x.ts')).toContain('import-x/order');
  });

  it('accepts builtin, external, @josecoded, relative, type order', async () => {
    const code = [
      "import { readFileSync } from 'node:fs';",
      '',
      "import { z } from 'zod';",
      '',
      "import { thing } from '@josecoded/types';",
      '',
      "import { a } from './a';",
      '',
      "import type { B } from './b';",
      '',
      'console.log(readFileSync, z, thing, a);',
      'export type { B };',
      '',
    ].join('\n');
    expect(await rules(code, 'packages/types/src/x.ts')).not.toContain('import-x/order');
  });

  it('flags duplicate imports', async () => {
    const code = "import { a } from 'zod';\nimport { b } from 'zod';\nconsole.log(a, b);\n";
    expect(await rules(code, 'packages/types/src/x.ts')).toContain('import-x/no-duplicates');
  });

  it('flags import cycles', async () => {
    const file = 'packages/config/test/fixtures/cycle/a.ts';
    const code = "import { b } from './b';\nexport const a = () => b;\n";
    expect(await rules(code, file)).toContain('import-x/no-cycle');
  });
});

describe('react/jsx-no-literals', () => {
  it('rejects raw text in JSX components', async () => {
    const code = 'export function C() { return <p>Hola</p>; }\n';
    expect(await rules(code, 'apps/web/components/ui/c/c.tsx')).toContain('react/jsx-no-literals');
  });

  it('accepts expressions', async () => {
    const code = 'export function C({ t }: { t: string }) { return <p>{t}</p>; }\n';
    expect(await rules(code, 'apps/web/components/ui/c/c.tsx')).not.toContain(
      'react/jsx-no-literals',
    );
  });
});

describe('eslint-config-next under ESLint 10', () => {
  it('runs every next/react rule on a realistic component without crashing', async () => {
    const code = [
      "import { forwardRef, useEffect, useState } from 'react';",
      '',
      "import Link from 'next/link';",
      '',
      'export const Card = forwardRef<HTMLDivElement, { items: string[] }>(function Card({ items }, ref) {',
      '  const [open, setOpen] = useState(false);',
      '  useEffect(() => { setOpen(true); }, []);',
      '  return (',
      '    <div ref={ref} data-open={open}>',
      '      {items.map((i) => <Link key={i} href="/x">{i}</Link>)}',
      '      <img src="/a.png" alt="" />',
      '    </div>',
      '  );',
      '});',
      '',
    ].join('\n');
    const ids = await rules(code, 'apps/web/components/ui/card/card.tsx');
    expect(ids.filter((id) => id.startsWith('parse:'))).toEqual([]);
    expect(ids).toContain('@next/next/no-img-element');
  });
});

describe('scope of the strictness', () => {
  it('does not add the extra TypeScript rules Jose did not choose', async () => {
    // enum + React.FC + a value import used only as a type: none of that is banned here
    const code = [
      "import { z } from 'zod';",
      "import { FC } from 'react';",
      'export enum E { A }',
      'export const x: FC = () => null;',
      'export type T = typeof z;',
      '',
    ].join('\n');
    const ids = await rules(code, 'packages/types/src/x.ts');
    expect(ids).not.toContain('@typescript-eslint/consistent-type-imports');
    expect(ids).not.toContain('no-restricted-syntax');
    expect(ids).not.toContain('no-restricted-imports');
  });
});
