import { getTranslations } from 'next-intl/server';

import { loadFacts } from './facts-server';
import { siteGraph } from './jsonld';
import { siteUrl } from './urls';

import type { Locale } from '@josecoded/types';

/** Person + Organization + WebSite for the locale layout. */
export async function loadSiteGraph(locale: Locale) {
  const [facts, t] = await Promise.all([loadFacts(locale), getTranslations({ locale, namespace: 'seo' })]);
  return siteGraph({
    siteUrl: siteUrl(),
    locale,
    facts,
    jobTitle: t('jobTitle'),
    description: t.raw('personDescription') as string,
  });
}
