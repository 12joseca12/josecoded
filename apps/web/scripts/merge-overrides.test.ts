import { describe, expect, it } from 'vitest';

import { composeCatalogs, mergeMessages } from './merge-overrides';

const base = {
  services: { hero: { title: 'A', lead: 'Hola {name}', rich: 'Un <b>negrita</b>' } },
  common: { cta: 'Contacto' },
  auth: { login: { title: 'L' } },
};

describe('mergeMessages', () => {
  it('overrides an existing editable key in a copy and leaves the rest untouched', () => {
    const merged = mergeMessages(base, { 'services.hero.title': 'B' });
    expect(merged.services.hero.title).toBe('B');
    expect(merged.common.cta).toBe('Contacto');
    expect(base.services.hero.title).toBe('A');
  });

  it('returns an equal catalog when there are no overrides', () => {
    expect(Object.keys(composeCatalogs('es'))).toContain('services');
    expect(mergeMessages(base, {})).toEqual(base);
  });

  it('rejects keys that do not exist, including objects and extra depth', () => {
    expect(() => mergeMessages(base, { 'services.hero.nope': 'x' })).toThrow('unknown_key services.hero.nope');
    expect(() => mergeMessages(base, { 'services.hero': 'x' })).toThrow('unknown_key services.hero');
    expect(() => mergeMessages(base, { 'services.hero.title.deeper': 'x' })).toThrow('unknown_key');
    expect(() => mergeMessages(base, { 'services.__proto__.x': 'x' })).toThrow('unknown_key');
  });

  it('rejects admin-only and unknown namespaces', () => {
    expect(() => mergeMessages(base, { 'auth.login.title': 'x' })).toThrow('namespace_not_editable auth');
    expect(() => mergeMessages(base, { 'nope.a.b': 'x' })).toThrow('namespace_not_editable nope');
  });

  it('rejects {{DATO}}, empty and non-string values', () => {
    expect(() => mergeMessages(base, { 'services.hero.title': '{{DATO}}' })).toThrow('dato_placeholder services.hero.title');
    expect(() => mergeMessages(base, { 'services.hero.title': ' ' })).toThrow('not_text');
    expect(() => mergeMessages(base, { 'services.hero.title': 3 })).toThrow('not_text');
  });

  it('keeps messages plain text: no new tags, no arguments the base lacks', () => {
    expect(() => mergeMessages(base, { 'services.hero.title': '<script>x</script>' })).toThrow('html_not_allowed');
    expect(() => mergeMessages(base, { 'services.hero.lead': 'Hola {other}' })).toThrow('unknown_argument');
    expect(mergeMessages(base, { 'services.hero.lead': 'Buenas {name}' }).services.hero.lead).toBe('Buenas {name}');
    expect(mergeMessages(base, { 'services.hero.rich': 'Otro <b>texto</b>' }).services.hero.rich).toBe('Otro <b>texto</b>');
  });
});
