// Runs only on the Mac (the vault is in iCloud); skipped in CI when there is no tarifas.md.
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';

import { expect, it } from 'vitest';

import { parseTarifas } from '../scripts/sync-from-tarifas';

const TARIFAS =
  process.env.TARIFAS_PATH ??
  `${homedir()}/Library/Mobile Documents/iCloud~md~obsidian/Documents/jose/Comercial/tarifas.md`;
const TARIFAS_EN = TARIFAS.replace(/tarifas\.md$/, 'tarifas.en.md');

it.skipIf(!existsSync(TARIFAS))('pricing.json equals tarifas.md', () => {
  const generated = parseTarifas(
    readFileSync(TARIFAS, 'utf8'),
    existsSync(TARIFAS_EN) ? readFileSync(TARIFAS_EN, 'utf8') : undefined,
  );
  const committed: unknown = JSON.parse(
    readFileSync(new URL('../pricing.json', import.meta.url), 'utf8'),
  );
  expect(generated).toEqual(committed);
});
