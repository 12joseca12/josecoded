// `pnpm pricing:pull`: writes content/pricing.json from `pricing_catalog_snapshot()` of the LOCAL database, for development
// parity (D54, plan 3.1c). In production the same file is written by the gateway's bot when the admin publishes; both use
// `stableStringify`, so the same catalogue is the same bytes. It reads with the secret key of the local stack, so it
// refuses any host that is not loopback: a production key never belongs in a developer's shell.
import { writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { pricingSchema } from '@josecoded/types';

import { stableStringify } from '../src/serialize.ts';

const TARGET = new URL('../../../content/pricing.json', import.meta.url);
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

/** The text of `content/pricing.json` for a snapshot: validated with the real schema first, so a bad one writes nothing. */
export function fileFromSnapshot(snapshot: unknown): string {
  return stableStringify(pricingSchema.parse(snapshot));
}

export function assertLocal(url: string): void {
  if (!LOOPBACK.has(new URL(url).hostname)) {
    throw new Error(`pricing:pull only reads a local Supabase (got ${new URL(url).hostname})`);
  }
}

async function main() {
  const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('pricing:pull needs SUPABASE_SECRET_KEY (the secret key of the local stack: `supabase status`)');
  assertLocal(url);
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/pricing_catalog_snapshot`, {
    method: 'POST',
    headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw new Error(`pricing_catalog_snapshot failed (${res.status})`);
  writeFileSync(TARGET, fileFromSnapshot(await res.json()));
  console.log(`wrote ${fileURLToPath(TARGET)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'pricing:pull failed');
    process.exit(1);
  });
}
