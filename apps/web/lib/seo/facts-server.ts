import { getTranslations } from 'next-intl/server';

import { readFacts } from './facts';

import type { SiteFacts } from './facts';
import type { Locale } from '@josecoded/types';

/** `facts.*` of a locale, without the pending ones. */
export async function loadFacts(locale: Locale): Promise<SiteFacts> {
  const t = await getTranslations({ locale, namespace: 'facts' });
  const raw: Record<string, string> = {};
  for (const key of ['givenNames', 'surnames', 'city', 'photo', 'email', 'githubUser', 'linkedinUrl'] as const) {
    // raw: the {{DATO}} markers contain braces that ICU would try to parse
    raw[key] = t.raw(key) as string;
  }
  return readFacts(raw);
}
