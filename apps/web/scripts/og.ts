// Writes public/og/<key>-<locale>.png at build time (task 2.11): one 1200x630 card per public section and language, in the
// site's own colours (read from the generated tokens.css) and Geist. It uses the satori + resvg that ship inside Next
// (`next/og`), so no dependency is added, and the worker never renders anything. `pageMetadata` points at these files.
// Runs with plain Node (type stripping, Node >= 22.18), so internal imports carry `.ts`.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { ImageResponse } from 'next/og.js';

import { isPendingDato } from '../lib/content/dato.ts';
import { OG_KEYS } from '../lib/seo/og-keys.ts';

export const LOCALES = ['es', 'en'] as const;
type Locale = (typeof LOCALES)[number];

export interface OgCard {
  /** File name under public/og. */
  file: string;
  title: string;
  tagline: string;
}

type Messages = Record<string, Record<string, unknown>>;

const get = (messages: Messages, path: string): string | undefined =>
  path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], messages) as string | undefined;

/** One card per key and language. A title that is still a `{{DATO}}` drops the card (the default one stands in). */
export function ogCards(messages: Record<Locale, Messages>): OgCard[] {
  const cards: OgCard[] = [];
  for (const locale of LOCALES) {
    const tagline = get(messages[locale], 'seo.home.title');
    const site = get(messages[locale], 'site.name');
    for (const [key, titlePath] of Object.entries(OG_KEYS)) {
      const title = titlePath === null ? site : get(messages[locale], titlePath);
      if (!title || !tagline || isPendingDato(title) || isPendingDato(tagline)) continue;
      cards.push({ file: `${key}-${locale}.png`, title, tagline });
    }
  }
  return cards;
}

function readMessages(root: string): Record<Locale, Messages> {
  const out = {} as Record<Locale, Messages>;
  for (const locale of LOCALES) {
    const dir = join(root, 'messages', locale);
    out[locale] = Object.assign({}, ...readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8'))));
  }
  return out;
}

/** `--name: value;` pairs of the generated tokens. */
export function readTokens(css: string): Record<string, string> {
  return Object.fromEntries([...css.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name as string, (value as string).trim()]));
}

const node = (type: string, style: Record<string, string | number>, children?: unknown) => ({ type, props: { style, children } });

function element(card: OgCard, t: Record<string, string>) {
  const color = (name: string) => t[name] ?? '#ffffff';
  const longTitle = card.title.length > 22;
  return node(
    'div',
    { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: 80, background: color('bg'), fontFamily: 'Geist', color: color('text') },
    [
      node('div', { display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 600 }, [
        node('div', { width: 20, height: 20, borderRadius: 6, background: color('violet') }),
        node('div', {}, 'josecoded'),
      ]),
      node('div', { display: 'flex', flexDirection: 'column', gap: 24 }, [
        node('div', { fontSize: longTitle ? 96 : 120, fontWeight: 600, lineHeight: 1, letterSpacing: -4 }, card.title),
        node('div', { fontSize: 48, fontWeight: 400, lineHeight: 1.2, color: color('highlight') }, card.tagline),
      ]),
    ],
  );
}

async function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const outDir = join(root, 'public', 'og');
  mkdirSync(outDir, { recursive: true });
  const tokens = readTokens(readFileSync(join(root, 'styles', 'tokens.css'), 'utf8'));
  const fonts = [
    { name: 'Geist', data: readFileSync(join(root, 'assets', 'og', 'Geist-Regular.ttf')), weight: 400 as const, style: 'normal' as const },
    { name: 'Geist', data: readFileSync(join(root, 'assets', 'og', 'Geist-SemiBold.ttf')), weight: 600 as const, style: 'normal' as const },
  ];
  const cards = ogCards(readMessages(root));
  for (const card of cards) {
    const image = new ImageResponse(element(card, tokens) as never, { width: 1200, height: 630, fonts });
    writeFileSync(join(outDir, card.file), Buffer.from(await image.arrayBuffer()));
  }
  console.log(`og: ${cards.length} cards in public/og`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
