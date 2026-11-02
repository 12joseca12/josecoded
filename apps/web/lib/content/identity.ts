import { fullName } from '@/lib/seo/facts';

import type { SiteFacts } from '@/lib/seo/facts';

type IdentityT = (key: 'full' | 'named' | 'city' | 'bare', values?: { name?: string; city?: string }) => string;

/**
 * The first sentence of the citable paragraph (SEO/GEO analysis §2.2): who, what and where. It states
 * only what is known: the name and the city come from `facts.*`, and a fact still pending drops its
 * clause instead of printing a marker (`about.identity.*`).
 */
export function identitySentence(t: IdentityT, facts: SiteFacts): string {
  const name = fullName(facts);
  if (name && facts.city) return t('full', { name, city: facts.city });
  if (name) return t('named', { name });
  if (facts.city) return t('city', { city: facts.city });
  return t('bare');
}
