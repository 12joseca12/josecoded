// Generates pricing.json from Comercial/tarifas.md (single source of prices).
// Runs with plain Node (type stripping, Node >= 22.18): no runtime imports of workspace
// packages and `import type` only. Validation against the zod schema lives in the tests.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { PricingData } from '@josecoded/types';

const VAULT_COMERCIAL = `${homedir()}/Library/Mobile Documents/iCloud~md~obsidian/Documents/jose/Comercial`;

const EXTRA_BY_NAME: Record<string, PricingData['extras'][number]['code']> = {
  'mantenimiento básico': 'maintenance_basic',
  'mantenimiento extendido': 'maintenance_extended',
  'seo básico': 'seo_basic',
  'seo completo': 'seo_full',
  geo: 'geo',
  'análisis de ciberseguridad': 'security_audit',
};
const APP_CODES = ['APP_MVP', 'APP_PLUS'] as const;

/** Text that still has to be written by `redactor` / `comercial`. Never invented here. */
const pending = (what: string, lang: 'es' | 'en') => `{{DATO: ${what} (${lang})}}`;

type Row = string[];

function section(md: string, heading: string): string {
  const lines = md.split('\n');
  const start = lines.findIndex(
    (l) => l.startsWith('## ') && l.slice(3).trim().startsWith(heading),
  );
  if (start === -1) throw new Error(`tarifas: missing section "${heading}"`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('## '));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

/** Body rows of the first Markdown table in a section (header and separator skipped). */
function tableRows(text: string): Row[] {
  const rows = text
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim()),
    );
  return rows.slice(2);
}

function euros(cell: string): number {
  const m = /(\d{1,3}(?:\.\d{3})+|\d+)\s*€/.exec(cell);
  if (!m?.[1]) throw new Error(`tarifas: no price in "${cell}"`);
  return Number(m[1].replace(/\./g, ''));
}

function weeks(cell: string): number {
  const m = /(\d+)\s*semana/.exec(cell);
  if (!m?.[1]) throw new Error(`tarifas: no weeks in "${cell}"`);
  return Number(m[1]);
}

function percent(cell: string): number {
  const m = /(\d+)\s*%/.exec(cell);
  if (!m?.[1]) throw new Error(`tarifas: no percentage in "${cell}"`);
  return Number(m[1]);
}

function cell(row: Row, index: number): string {
  const value = row[index];
  if (value === undefined)
    throw new Error(`tarifas: row without column ${index}: ${row.join('|')}`);
  return value;
}

interface ParsedTarifas {
  version: string;
  hourly: number;
  feature: number;
  packs: { code: string; name: string; includes: string; price: number; weeks: number }[];
  apps: { code: string; name: string; includes: string; price: number; weeks: number }[];
  extras: {
    code: string;
    label: string;
    description: string;
    price: number;
    billing: 'one_off' | 'monthly';
  }[];
  affiliate: PricingData['affiliate'];
}

function parseOne(md: string): ParsedTarifas {
  const version = /Vigencia:\s*desde el (\d{4}-\d{2}-\d{2})/.exec(md)?.[1];
  if (!version) throw new Error('tarifas: missing "Vigencia: desde el AAAA-MM-DD"');

  const hourText = section(md, 'Tarifa hora');
  const hourly = /(\d+)\s*€\/h/.exec(hourText)?.[1];
  const feature = /(\d+)\s*€ por feature/.exec(hourText)?.[1];
  if (!hourly || !feature) throw new Error('tarifas: hourly rate or feature price not found');

  const packs = tableRows(section(md, 'Packs web')).map((row) => {
    const m = /^(P[1-4])\s+(.+)$/.exec(cell(row, 0));
    if (!m?.[1] || !m[2]) throw new Error(`tarifas: bad pack name "${cell(row, 0)}"`);
    return {
      code: m[1],
      name: m[2],
      includes: cell(row, 1),
      price: euros(cell(row, 2)),
      weeks: weeks(cell(row, 3)),
    };
  });

  const apps = tableRows(section(md, 'Packs móvil')).map((row, i) => ({
    code: APP_CODES[i] ?? `APP_${i}`,
    name: cell(row, 0),
    includes: cell(row, 1),
    price: euros(cell(row, 2)),
    weeks: weeks(cell(row, 3)),
  }));

  const extras = tableRows(section(md, 'Extras (packs aparte)')).map((row) => {
    const name = cell(row, 0);
    const code = EXTRA_BY_NAME[name.toLowerCase()];
    if (!code) throw new Error(`tarifas: unknown extra "${name}"`);
    const price = cell(row, 2);
    return {
      code,
      label: name,
      description: cell(row, 1),
      price: euros(price),
      billing: /\/mes/.test(price) ? ('monthly' as const) : ('one_off' as const),
    };
  });

  const affiliateText = section(md, 'Afiliados');
  if (!/primer pedido/.test(affiliateText) || !/sin IVA/.test(affiliateText)) {
    throw new Error('tarifas: affiliate base must be "primer pedido ... sin IVA"');
  }
  const rewardRows = tableRows(affiliateText);
  const reward = (needle: string) => {
    const row = rewardRows.find((r) => cell(r, 0).toLowerCase().includes(needle));
    if (!row) throw new Error(`tarifas: affiliate row "${needle}" not found`);
    return cell(row, 1);
  };
  const months = /(\d+)\s*meses/.exec(reward('existente'))?.[1];
  if (!months) throw new Error('tarifas: client reward months not found');

  return {
    version,
    hourly: Number(hourly),
    feature: Number(feature),
    packs,
    apps,
    extras,
    affiliate: {
      client: { maintenanceMonths: Number(months) },
      standard: { percent: percent(reward('no cliente')) },
      premium: { percent: percent(reward('premium')) },
      base: 'first_order_ex_vat',
    },
  };
}

/**
 * Builds pricing.json. Spanish texts come verbatim from `tarifas.md`; English texts come from an
 * optional `tarifas.en.md` with the same layout and numbers. Missing texts are `{{DATO: …}}`
 * markers (forWhom exists in neither source), never invented copy.
 */
export function parseTarifas(md: string, mdEn?: string): PricingData {
  const es = parseOne(md);
  const en = mdEn ? parseOne(mdEn) : undefined;
  if (en) {
    const nums = (p: ParsedTarifas) =>
      JSON.stringify([
        p.version,
        p.hourly,
        p.feature,
        p.packs.map((x) => [x.code, x.price, x.weeks]),
        p.apps.map((x) => [x.price, x.weeks]),
        p.extras.map((x) => [x.code, x.price, x.billing]),
        p.affiliate,
      ]);
    if (nums(es) !== nums(en)) throw new Error('tarifas.en.md numbers differ from tarifas.md');
  }
  const enOf = <T extends { code: string }>(list: T[] | undefined, code: string) =>
    list?.find((x) => x.code === code);

  return {
    version: es.version,
    hourly: es.hourly,
    feature: es.feature,
    packs: es.packs.map((p) => {
      const e = enOf(en?.packs, p.code);
      return {
        code: p.code as PricingData['packs'][number]['code'],
        name: { es: p.name, en: e?.name ?? pending(`pack ${p.code} name`, 'en') },
        price: p.price,
        weeks: p.weeks,
        includes: {
          es: [p.includes],
          en: [e?.includes ?? pending(`pack ${p.code} includes`, 'en')],
        },
        forWhom: {
          es: pending(`pack ${p.code} forWhom`, 'es'),
          en: pending(`pack ${p.code} forWhom`, 'en'),
        },
      };
    }),
    apps: es.apps.map((a) => {
      const e = enOf(en?.apps, a.code);
      return {
        code: a.code as PricingData['apps'][number]['code'],
        name: { es: a.name, en: e?.name ?? pending(`app ${a.code} name`, 'en') },
        price: a.price,
        weeks: a.weeks,
        includes: {
          es: [a.includes],
          en: [e?.includes ?? pending(`app ${a.code} includes`, 'en')],
        },
        forWhom: {
          es: pending(`app ${a.code} forWhom`, 'es'),
          en: pending(`app ${a.code} forWhom`, 'en'),
        },
      };
    }),
    extras: es.extras.map((x) => {
      const e = enOf(en?.extras, x.code);
      return {
        code: x.code as PricingData['extras'][number]['code'],
        label: { es: x.label, en: e?.label ?? pending(`extra ${x.code} label`, 'en') },
        description: {
          es: x.description,
          en: e?.description ?? pending(`extra ${x.code} description`, 'en'),
        },
        price: x.price,
        billing: x.billing,
      };
    }),
    upgradeRule: 'list_difference',
    affiliate: es.affiliate,
  };
}

function main() {
  const tarifas = process.env.TARIFAS_PATH ?? `${VAULT_COMERCIAL}/tarifas.md`;
  const tarifasEn = tarifas.replace(/tarifas\.md$/, 'tarifas.en.md');
  if (!existsSync(tarifas)) {
    throw new Error(`tarifas.md not found at ${tarifas} (set TARIFAS_PATH). Runs only on the Mac.`);
  }
  const data = parseTarifas(
    readFileSync(tarifas, 'utf8'),
    existsSync(tarifasEn) ? readFileSync(tarifasEn, 'utf8') : undefined,
  );
  const out = fileURLToPath(new URL('../pricing.json', import.meta.url));
  writeFileSync(out, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`pricing.json written (version ${data.version})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
