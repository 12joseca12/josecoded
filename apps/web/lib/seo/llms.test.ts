import { describe, expect, it } from 'vitest';

import { pricing } from '@josecoded/pricing';

import { readFacts } from './facts';
import { buildLlms } from './llms';

const input = {
  siteUrl: 'https://josecoded.com',
  locale: 'es' as const,
  description: 'Hago webs con Next.js.',
  facts: readFacts({ givenNames: '{{DATO: nombre}}', surnames: '{{DATO: apellidos}}', email: '{{DATO: email}}' }),
  pricing,
  pages: [
    { title: 'Servicios', url: 'https://josecoded.com/servicios', summary: '{{DATO: resumen}}' },
    { title: 'Proyectos', url: 'https://josecoded.com/proyectos' },
  ],
  otherLanguagePages: [{ title: 'Services', url: 'https://josecoded.com/en/services' }],
  labels: {
    pages: 'Páginas',
    prices: 'Precios (sin IVA)',
    hourly: 'Por horas',
    fixed: 'Funcionalidad a precio cerrado, desde',
    packFrom: 'desde',
    weeks: (n: number) => `${n} sem.`,
    contact: 'Contacto',
    english: 'English',
    author: 'Autor',
    includes: 'Incluye',
  },
  full: false,
};

describe('buildLlms', () => {
  it('lists pages and prices from pricing.json and never prints a {{DATO}}', () => {
    const text = buildLlms(input);
    expect(text).toContain('# josecoded');
    expect(text).toContain('- [Servicios](https://josecoded.com/servicios)\n');
    expect(text).toContain('- Por horas: 40 €/h');
    expect(text).toContain('P2: desde 1.400 € (2 sem.)'.replace('P2', 'Pedidos / reservas'));
    expect(text).toContain('P1: desde 900 €'.replace('P1', 'Web básica'));
    expect(text).not.toContain('{{DATO');
    expect(text).not.toContain('Autor:');
  });

  it('the full version adds what every pack includes and the contact block', () => {
    const text = buildLlms({ ...input, full: true, facts: readFacts({ givenNames: 'Ana', surnames: 'Prueba', email: 'hola@example.com' }) });
    expect(text).toContain('Autor: Ana Prueba');
    expect(text).toContain('Incluye: Web de presentación');
    expect(text).toContain('Email: hola@example.com');
    expect(text).not.toContain('{{DATO');
  });
});
