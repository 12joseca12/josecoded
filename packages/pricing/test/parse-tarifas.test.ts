import { describe, expect, it } from 'vitest';

import { pricingSchema } from '@josecoded/types';

import { parseTarifas } from '../scripts/sync-from-tarifas';

const md = `# Tarifas
**Vigencia: desde el 2026-09-14** (v2).

## Tarifa hora
- Desarrollo: 40 €/h
- Feature extra con alcance cerrado (fuera de pack): 150 € por feature

## Packs web (precio cerrado)
| Pack | Incluye | Precio | Plazo |
|---|---|---|---|
| P1 Web básica | Presentación | 900 € | 1 semana |
| P2 Pedidos | P1 + pedidos | 1.400 € | 2 semanas |
| P3 Gestión | P2 + panel | 2.500 € | 2 semanas |
| P4 Gestión + auto | P3 + n8n | 4.200 € | 3 semanas |

## Packs móvil (precio cerrado)
| Pack | Incluye | Precio | Plazo |
|---|---|---|---|
| App MVP | Expo | 4.000 € | 6 semanas |
| App ampliada | MVP + pagos | 6.000 € | 8 semanas |

## Extras (packs aparte)
| Extra | Incluye | Precio |
|---|---|---|
| Mantenimiento básico | Copias | 49 €/mes |
| Mantenimiento extendido | Básico + soporte | 149 €/mes |
| SEO básico | Metadatos | 250 € |
| SEO completo | SEO básico + keywords | 600 € |
| GEO | llms.txt | 300 € |
| Análisis de ciberseguridad | Revisión | 250 € |

## Extras incluidos por pack (no oficiales)
| Pack | Regalo | Valor |
|---|---|---|
| P1 | 1 mes de mantenimiento básico | 49 € |

## Afiliados
Base de cálculo: pack + extras del **primer pedido** del cliente referido, sin IVA.
| Afiliado | Recompensa |
|---|---|
| Cliente existente | 2 meses de mantenimiento básico gratis |
| No cliente | 10 % de la base |
| Premium (nombrado a mano por Jose) | 20 % de la base |
`;

describe('parseTarifas', () => {
  const data = parseTarifas(md);

  it('produces data the schema accepts', () => {
    expect(pricingSchema.safeParse(data).success).toBe(true);
  });

  it('reads numbers, thousands separators and billing', () => {
    expect(data.version).toBe('2026-09-14');
    expect([data.hourly, data.feature]).toEqual([40, 150]);
    expect(data.packs.map((p) => [p.code, p.price, p.weeks])).toEqual([
      ['P1', 900, 1],
      ['P2', 1400, 2],
      ['P3', 2500, 2],
      ['P4', 4200, 3],
    ]);
    expect(data.apps.map((a) => [a.code, a.price, a.weeks])).toEqual([
      ['APP_MVP', 4000, 6],
      ['APP_PLUS', 6000, 8],
    ]);
    expect(data.extras.find((e) => e.code === 'maintenance_extended')).toMatchObject({
      price: 149,
      billing: 'monthly',
    });
    expect(data.affiliate).toEqual({
      client: { maintenanceMonths: 2 },
      standard: { percent: 10 },
      premium: { percent: 20 },
      base: 'first_order_ex_vat',
    });
  });

  it('ignores the gifts table', () => {
    expect(JSON.stringify(data)).not.toMatch(/regalo|gift|1 mes de mantenimiento/i);
  });

  it('leaves {{DATO}} markers instead of inventing English and forWhom copy', () => {
    const p1 = data.packs[0];
    expect(p1?.name.es).toBe('Web básica');
    expect(p1?.name.en).toBe('{{DATO: pack P1 name (en)}}');
    expect(p1?.forWhom.es).toContain('{{DATO');
    expect(p1?.forWhom.en).toContain('{{DATO');
  });

  it('takes English texts from tarifas.en.md when it exists and checks the numbers match', () => {
    const mdEn = md
      .replace('Web básica', 'Basic website')
      .replace('Vigencia: desde el', 'Valid from');
    expect(() => parseTarifas(md, mdEn)).toThrow(/Vigencia/);
    const enOk = md.replace('Web básica', 'Basic website');
    expect(parseTarifas(md, enOk).packs[0]?.name).toEqual({
      es: 'Web básica',
      en: 'Basic website',
    });
    expect(() => parseTarifas(md, enOk.replace('900 €', '950 €'))).toThrow(/differ/);
  });

  it('fails loudly on an unknown extra or a missing section', () => {
    expect(() => parseTarifas(md.replace('GEO |', 'Otro |'))).toThrow(/unknown extra/);
    expect(() => parseTarifas(md.replace('## Afiliados', '## Otra cosa'))).toThrow(/Afiliados/);
  });
});
