import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { HEADER_NAMESPACES, pickHeaderMessages } from './header-messages';

const layoutDir = join(__dirname, '..');
// client islands rendered inside the header's NextIntlClientProvider
const islands = ['user-menu', 'search-trigger', 'lang-switch', 'mobile-menu', 'nav-links', 'chat-trigger'];

function namespacesUsedBy(dir: string): string[] {
  const used: string[] = [];
  for (const file of readdirSync(join(layoutDir, dir))) {
    if (!/\.tsx?$/.test(file) || /\.test\./.test(file)) continue;
    const source = readFileSync(join(layoutDir, dir, file), 'utf8');
    for (const match of source.matchAll(/useTranslations\('([^'.]+)[^']*'\)/g)) used.push(match[1]!);
  }
  return used;
}

describe('header messages', () => {
  it('ships every namespace the header islands read with useTranslations', () => {
    const missing = islands.flatMap(namespacesUsedBy).filter((name) => !(HEADER_NAMESPACES as readonly string[]).includes(name));
    expect(missing).toEqual([]);
  });

  it('picks only the header namespaces', () => {
    const picked = pickHeaderMessages({ nav: { a: 1 }, footer: { b: 2 }, home: { c: 3 } });
    expect(Object.keys(picked).sort()).toEqual(['footer', 'nav']);
  });
});
