import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const committed = join(root, 'packages', 'types', 'src', 'database.ts');

// Supabase local answers on the API port (config.toml [api] port = 54321).
const localUrl = process.env.SUPABASE_LOCAL ?? 'http://127.0.0.1:54321';

async function supabaseIsUp(): Promise<boolean> {
  try {
    const res = await fetch(`${localUrl}/auth/v1/health`, { signal: AbortSignal.timeout(1500) });
    return res.status < 500;
  } catch {
    return false;
  }
}

const up = await supabaseIsUp();
const inCi = Boolean(process.env.CI);

if (!up) {
  console.warn(
    `[database-drift] Supabase local not reachable at ${localUrl}: drift check skipped.` +
      (inCi ? ' In CI this is an error.' : ' Run `supabase start` to enable it.'),
  );
}

describe('database.ts drift', () => {
  it.skipIf(!up && !inCi)('matches `supabase gen types --local` byte for byte', () => {
    expect(up, `Supabase local must be running in CI (${localUrl})`).toBe(true);
    const generated = execFileSync(
      'supabase',
      ['gen', 'types', 'typescript', '--local', '--workdir', root],
      { encoding: 'utf8' },
    );
    expect(readFileSync(committed, 'utf8')).toBe(generated);
  });
});
