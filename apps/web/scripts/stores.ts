// Writes content/generated/stores.json: the store pages of the apps in the project sheets. It only feeds links and
// JSON-LD (`installUrl`); ratings, installs and counts are never read or shown (the site publishes no metrics).
// Run by `pnpm --filter @josecoded/web content:refresh`, never by the build.
// App Store: the iTunes Lookup API confirms the id exists and gives the canonical page URL. Google Play has no public
// API and the plan's scraper is not a dependency of the project, so a Play entry is the link built from the package
// name. Screenshots are not hotlinked (the CSP only allows the site's own images): they are files under
// `public/projects/<slug>/` that Jose supplies, listed in the sheet's `screenshots`.
// Until Jose gives the ids this writes an empty file. Runs with plain Node: internal imports carry `.ts`.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { projectSchema } from '../content/projects/schema.ts';
import { isPendingDato } from '../lib/content/dato.ts';

export interface StoreEntry {
  appStoreUrl?: string;
  playUrl?: string;
}
export type StoresIndex = Record<string, StoreEntry>;

type Fetch = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

const real = (value: string | undefined): value is string => value !== undefined && value.trim() !== '' && !isPendingDato(value);

export async function lookupAppStore(id: string, fetchImpl: Fetch = fetch as unknown as Fetch): Promise<string | undefined> {
  const fallback = `https://apps.apple.com/app/id${id}`;
  try {
    const response = await fetchImpl(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}`);
    if (!response.ok) return fallback;
    const body = (await response.json()) as { resultCount?: number; results?: { trackViewUrl?: string }[] };
    return body.resultCount ? (body.results?.[0]?.trackViewUrl?.split('?')[0] ?? fallback) : undefined;
  } catch {
    return fallback;
  }
}

export async function buildStores(
  sheets: { slug: string; proofs: { appStoreId?: string; playPackage?: string } }[],
  previous: StoresIndex,
  fetchImpl?: Fetch,
): Promise<StoresIndex> {
  const result: StoresIndex = {};
  for (const sheet of sheets) {
    const entry: StoreEntry = {};
    const { appStoreId, playPackage } = sheet.proofs;
    if (real(appStoreId)) {
      const url = await lookupAppStore(appStoreId, fetchImpl);
      if (url) entry.appStoreUrl = url;
      else if (previous[sheet.slug]?.appStoreUrl) entry.appStoreUrl = previous[sheet.slug]?.appStoreUrl as string;
    }
    if (real(playPackage)) entry.playUrl = `https://play.google.com/store/apps/details?id=${playPackage}`;
    if (Object.keys(entry).length > 0) result[sheet.slug] = entry;
  }
  return result;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const contentRoot = fileURLToPath(new URL('../content', import.meta.url));
  const dir = join(contentRoot, 'projects');
  const sheets = readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => projectSchema.parse(JSON.parse(readFileSync(join(dir, name), 'utf8'))));
  const target = join(contentRoot, 'generated/stores.json');
  const previous: StoresIndex = existsSync(target) ? (JSON.parse(readFileSync(target, 'utf8')) as StoresIndex) : {};
  const index = await buildStores(sheets, previous);
  mkdirSync(join(contentRoot, 'generated'), { recursive: true });
  writeFileSync(target, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`stores: ${Object.keys(index).length} apps with a store page`);
}
