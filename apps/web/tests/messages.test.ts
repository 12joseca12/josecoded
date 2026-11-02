import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// messages/<locale>/<screen>.json are spread into one object (messages/<locale>.ts): a top-level
// key declared in two screens would silently overwrite the other one.
const root = join(import.meta.dirname, '..', 'messages');
const locales = ['es', 'en'] as const;

function screens(locale: string): Record<string, Record<string, unknown>> {
  const dir = join(root, locale);
  return Object.fromEntries(
    readdirSync(dir)
      .filter((file) => file.endsWith('.json'))
      .sort()
      .map((file) => [
        file.replace(/\.json$/, ''),
        JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<string, unknown>,
      ]),
  );
}

describe('message catalogs', () => {
  it('has the 27 screens in both languages', () => {
    const expected = [
      'about',
      'admin-notifications',
      'admin-pricing',
      'admin-team',
      'admin-texts',
      'admin-texts',
      'area',
      'auth',
      'blog',
      'chat',
      'common',
      'contact',
      'crm-clients',
      'crm-commissions',
      'crm-contacts',
      'crm',
      'dev',
      'home',
      'lab',
      'legal',
      'newsletter',
      'partners',
      'projects',
      'proposal',
      'seo',
      'services',
      'stories',
    ];
    for (const locale of locales) expect(Object.keys(screens(locale))).toEqual(expected);
  });

  it.each(locales)('has no top-level key declared by two screens (%s)', (locale) => {
    const owners = new Map<string, string[]>();
    for (const [screen, content] of Object.entries(screens(locale))) {
      for (const key of Object.keys(content)) owners.set(key, [...(owners.get(key) ?? []), screen]);
    }
    const collisions = [...owners].filter(([, screensWithKey]) => screensWithKey.length > 1);
    expect(collisions).toEqual([]);
  });

  it('declares the same top-level keys per screen in es and en', () => {
    const es = screens('es');
    const en = screens('en');
    for (const screen of Object.keys(es)) {
      expect(Object.keys(en[screen] ?? {}).sort(), screen).toEqual(
        Object.keys(es[screen] ?? {}).sort(),
      );
    }
  });
});
