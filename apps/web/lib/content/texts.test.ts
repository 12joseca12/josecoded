import { describe, expect, it } from 'vitest';

import { collectTexts, haystack, matchesQuery, namespaceCounts, textState } from './texts';

const es = {
  services: { hero: { title: 'Trabajo como freelance', note: 'Precios desde' }, list: ['a', 'b'] },
  home: { title: 'Inicio' },
  auth: { title: 'Acceso' },
  nav: { home: 'Inicio' },
};
const en = { services: { hero: { title: 'Freelance work' } }, home: { title: 'Home' }, auth: { title: 'Sign in' } };

describe('collectTexts', () => {
  it('lists the string leaves of the editable namespaces only, in the site order, with the English counterpart', () => {
    const entries = collectTexts(es, en);
    expect(entries.map((entry) => entry.key)).toEqual(['home.title', 'services.hero.title', 'services.hero.note']);
    expect(entries[1]).toEqual({ key: 'services.hero.title', namespace: 'services', base: { es: 'Trabajo como freelance', en: 'Freelance work' } });
    expect(entries[2]!.base.en).toBe('');
  });

  it('counts texts per namespace and leaves out the empty ones', () => {
    expect(namespaceCounts(collectTexts(es, en))).toEqual([
      { namespace: 'home', count: 1 },
      { namespace: 'services', count: 2 },
    ]);
  });
});

describe('textState', () => {
  const published = { es: 'Nuevo', en: '', version: 3 };
  it('is unchanged without override and draft, published when they agree, modified otherwise', () => {
    expect(textState({ es: '', en: '' }, undefined)).toBe('unchanged');
    expect(textState({ es: 'Nuevo', en: '' }, published)).toBe('published');
    expect(textState({ es: 'Otro', en: '' }, published)).toBe('modified');
    expect(textState({ es: '', en: '' }, published)).toBe('modified');
    expect(textState({ es: 'Algo', en: '' }, undefined)).toBe('modified');
  });
});

describe('matchesQuery', () => {
  const [entry] = collectTexts(es, en).filter((candidate) => candidate.key === 'services.hero.title');
  const folded = haystack(entry!, { es: 'Versión corta', en: '' });
  it('finds by key or by text in either language, ignoring case and accents, every word required', () => {
    expect(matchesQuery(folded, 'hero')).toBe(true);
    expect(matchesQuery(folded, 'TRABAJO freelance')).toBe(true);
    expect(matchesQuery(folded, 'freelance work')).toBe(true);
    expect(matchesQuery(folded, 'version')).toBe(true);
    expect(matchesQuery(folded, 'hero nothing')).toBe(false);
    expect(matchesQuery(folded, '   ')).toBe(true);
  });
});
