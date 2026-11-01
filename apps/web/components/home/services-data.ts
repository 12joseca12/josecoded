import { formatPrice, pricing } from '@josecoded/pricing';

import type { Locale } from '@josecoded/types';

/** The five packs the scene shows: P1–P4 are web, P5 is the mobile app (`APP_MVP` in pricing). */
export const PACK_CODES = ['P1', 'P2', 'P3', 'P4', 'P5'] as const;
export type ScenePackCode = (typeof PACK_CODES)[number];

/** A price as the scene writes it: whole euros and a non-breaking space, so «40 €» never splits. */
function show(amount: number, locale: Locale): string {
  return formatPrice(amount, locale).replaceAll(' ', ' ');
}

/**
 * Every price of the Services scene, read from `@josecoded/pricing` and formatted for the locale.
 * Prices never live in `messages`: the scene and the checks read the same file.
 */
export function servicePrices(locale: Locale) {
  const app = pricing.apps.find((candidate) => candidate.code === 'APP_MVP');
  if (!app) throw new Error('pricing.json has no APP_MVP: the Services scene needs the fifth pack');
  const amounts: Record<ScenePackCode, number> = {
    P1: pack('P1'),
    P2: pack('P2'),
    P3: pack('P3'),
    P4: pack('P4'),
    P5: app.price,
  };
  return {
    hourly: show(pricing.hourly, locale),
    feature: show(pricing.feature, locale),
    packs: PACK_CODES.map((code) => ({ code, price: show(amounts[code], locale) })),
    /** The cheapest pack, for the «desde» of the packs route and of ⌘K. */
    fromPack: show(Math.min(...Object.values(amounts)), locale),
  };
}

function pack(code: 'P1' | 'P2' | 'P3' | 'P4'): number {
  const found = pricing.packs.find((candidate) => candidate.code === code);
  if (!found) throw new Error(`pricing.json has no ${code}`);
  return found.price;
}
