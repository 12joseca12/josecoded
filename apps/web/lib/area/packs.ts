import { pricing } from '@josecoded/pricing';

import { hasDato } from '@/lib/content/dato';

import type { Locale } from '@josecoded/types';

/** «P2 · Pedidos / reservas»; only «P2» while the translated name is still a `{{DATO}}` marker. */
export function packLabel(code: string, locale: Locale): string {
  const pack = pricing.packs.find((p) => p.code === code);
  const name = pack?.name[locale] ?? '';
  return hasDato(name) ? `${code} · ${name}` : code;
}

/** List price of a pack from `pricing.json` (the public number; the database holds the billable one). */
export function packPrice(code: string): number | null {
  return pricing.packs.find((p) => p.code === code)?.price ?? null;
}

/** Label of an extra; falls back to the Spanish one while the English text is still a `{{DATO}}`. */
export function extraLabel(code: string, locale: Locale): string {
  const extra = pricing.extras.find((e) => e.code === code);
  if (!extra) return code;
  return hasDato(extra.label[locale]) ? extra.label[locale] : extra.label.es;
}
