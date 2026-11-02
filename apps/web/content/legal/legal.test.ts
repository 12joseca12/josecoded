import { describe, expect, it } from 'vitest';

import { LEGAL_DOCS, legalContent, legalStrings } from '.';

describe('legal texts', () => {
  it('exist in both languages with valid structure and a description that fits a meta tag', () => {
    for (const doc of LEGAL_DOCS) {
      for (const locale of ['es', 'en'] as const) {
        const content = legalContent(doc, locale);
        expect(content.sections.length).toBeGreaterThan(2);
        expect(content.description.length).toBeLessThanOrEqual(155);
      }
    }
  });

  it('keep the owner data as markers until Jose supplies it, in both languages', () => {
    for (const locale of ['es', 'en'] as const) {
      const notice = legalStrings(legalContent('aviso-legal', locale)).join('\n');
      expect(notice).toContain('{{DATO');
      expect(notice).toMatch(/LSSI/);
    }
  });

  it('privacy names the lawful bases, the rights and the supervisory authority; cookies state the ref cookie needs consent', () => {
    const privacy = legalStrings(legalContent('privacidad', 'es')).join('\n');
    expect(privacy).toMatch(/AEPD|Agencia Española de Protección de Datos/);
    expect(privacy).toMatch(/portabilidad/);
    const cookies = legalStrings(legalContent('cookies', 'es')).join('\n');
    expect(cookies).toMatch(/ref/);
    expect(cookies).toMatch(/explícita/);
  });

  it('never carries the frases of the microcopy blacklist', () => {
    const text = LEGAL_DOCS.flatMap((doc) => legalStrings(legalContent(doc, 'es'))).join('\n');
    expect(text).not.toMatch(/soluciones|ayudo a|sin complicaciones|alto rendimiento|innovador/i);
  });
});
