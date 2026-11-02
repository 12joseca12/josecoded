import { hasDato } from '@/lib/content/dato';

import type { Catalogue, PriceBilling, PriceItem, PricePack, PriceText } from './catalogue';
import type { CatalogChange } from './diff';
import type { Database } from '@josecoded/types';

type Row<T extends 'packs' | 'pack_options' | 'extras'> = Database['public']['Tables'][T]['Row'];

export interface DraftRows {
  packs: readonly Row<'packs'>[];
  options: readonly Row<'pack_options'>[];
  extras: readonly Row<'extras'>[];
  settings: { hourly: number; feature: number };
}

const isText = (value: unknown): value is { es: string; en: string } =>
  typeof value === 'object' && value !== null && typeof (value as { es?: unknown }).es === 'string' && typeof (value as { en?: unknown }).en === 'string';
const isList = (value: unknown): value is { es: string[]; en: string[] } =>
  typeof value === 'object' && value !== null && Array.isArray((value as { es?: unknown }).es) && Array.isArray((value as { en?: unknown }).en);

/** A `{es, en}` column as the sheet edits it: an English `{{DATO}}` (or empty) is «not written yet» → `null`. */
function textOf(value: unknown): PriceText {
  return isText(value) ? { es: hasDato(value.es) ? value.es : '', en: hasDato(value.en) ? value.en : null } : { es: '', en: null };
}
function listOf(value: unknown): PriceText {
  return isList(value) ? textOf({ es: value.es.join('\n'), en: value.en.join('\n') }) : { es: '', en: null };
}
const optionalText = (value: unknown): PriceText | null => (isText(value) ? textOf(value) : null);

/** Where an item lives in `content/pricing.json`: the mobile app and its option are `apps`, with the legacy codes. */
export function publishedKey(item: { kind: 'pack' | 'option' | 'extra'; app: boolean; code: string; pack?: string }): {
  section: CatalogChange['section'];
  code: string;
} {
  if (item.kind === 'extra') return { section: 'extras', code: item.code };
  if (!item.app) return { section: 'packs', code: item.code };
  if (item.kind === 'pack') return { section: 'apps', code: item.code === 'P5' ? 'APP_MVP' : item.code };
  return { section: 'apps', code: item.pack === 'P5' && item.code === 'plus' ? 'APP_PLUS' : `${item.pack}_${item.code.toUpperCase()}` };
}

function marked(changes: readonly CatalogChange[], key: { section: CatalogChange['section']; code: string }) {
  const change = changes.find((c) => c.section === key.section && c.code === key.code);
  return { pending: change !== undefined, previous: change?.type === 'changed' ? (change.price?.from ?? null) : null };
}

const alive = <T extends { deleted_at: string | null }>(list: readonly T[]) => list.filter((row) => row.deleted_at === null);
const bySort = <T extends { sort: number | null; code: string }>(list: readonly T[]) =>
  [...list].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.code.localeCompare(b.code));

/**
 * The draft catalogue (the tables: what the admin has saved) as rows of D2, with what is unpublished marked from the
 * diff against `content/pricing.json`. A deleted item is not listed (restoring it is the next block's screen); a hidden
 * one is, as «Oculto». Hidden items are absent from the snapshot, so they show as pending when they were published.
 */
export function catalogueFromDraft(rows: DraftRows, changes: readonly CatalogChange[]): Catalogue {
  const packs: PricePack[] = bySort(alive(rows.packs)).map((pack) => {
    const app = pack.kind === 'app';
    const options: PriceItem[] = alive(rows.options)
      .filter((option) => option.pack_code === pack.code)
      .map((option) => ({
        kind: 'option',
        code: option.code,
        name: textOf(option.name),
        includes: listOf(option.includes),
        forWhom: optionalText(option.for_whom),
        price: option.price,
        weeks: option.weeks,
        billing: null,
        onSale: pack.active,
        visible: option.visible,
        ...marked(changes, publishedKey({ kind: 'option', app, code: option.code, pack: pack.code })),
      }));
    return {
      kind: 'pack',
      code: pack.code,
      name: textOf(pack.name),
      includes: listOf(pack.includes),
      forWhom: optionalText(pack.for_whom),
      price: pack.price,
      weeks: pack.weeks,
      billing: null,
      onSale: pack.active,
      visible: pack.visible,
      ...marked(changes, publishedKey({ kind: 'pack', app, code: pack.code })),
      app,
      options,
    };
  });
  const extras: PriceItem[] = bySort(alive(rows.extras)).map((extra) => ({
    kind: 'extra',
    code: extra.code,
    name: textOf(extra.name),
    includes: optionalText(extra.description) ?? { es: '', en: null },
    forWhom: null,
    price: extra.price,
    weeks: null,
    billing: extra.billing as PriceBilling,
    onSale: extra.active,
    visible: extra.visible,
    ...marked(changes, publishedKey({ kind: 'extra', app: false, code: extra.code })),
  }));
  return { packs, extras, ...rows.settings };
}
