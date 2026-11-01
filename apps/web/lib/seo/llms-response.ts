import { getTranslations } from 'next-intl/server';

import { formatPrice, pricing } from '@josecoded/pricing';

import { getSectionAvailability } from '@/lib/content/sections';

import { loadFacts } from './facts-server';
import { buildLlms } from './llms';
import { absoluteUrl, siteUrl } from './urls';

import type { LlmsPage } from './llms';
import type { PathnameKey } from './urls';
import type { Locale } from '@josecoded/types';

// (nav key, pathname) of the public sections; Lab and Blog only while they exist.
const SECTIONS: readonly [string, PathnameKey, 'lab' | 'blog' | null][] = [
  ['services', '/servicios', null],
  ['partners', '/partners', null],
  ['projects', '/proyectos', null],
  ['about', '/sobre-mi', null],
  ['lab', '/lab', 'lab'],
  ['blog', '/blog', 'blog'],
  ['contact', '/contacto', null],
];

async function pagesOf(locale: Locale): Promise<LlmsPage[]> {
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const availability = getSectionAvailability();
  return [
    { title: 'josecoded', url: absoluteUrl(locale, '/') },
    ...SECTIONS.filter(([, , gate]) => gate === null || availability[gate]).map(([key, pathname]) => ({
      title: nav(key as 'services'),
      url: absoluteUrl(locale, pathname),
    })),
  ];
}

/** Body of `/llms.txt` (`full: false`) and `/llms-full.txt`, Spanish with the English pages listed apart. */
export async function llmsBody(full: boolean): Promise<string> {
  const locale: Locale = 'es';
  const [seo, facts, pages, otherLanguagePages] = await Promise.all([
    getTranslations({ locale, namespace: 'seo' }),
    loadFacts(locale),
    pagesOf(locale),
    pagesOf('en'),
  ]);
  const cheapest = Math.min(...pricing.packs.map((pack) => pack.price));
  return buildLlms({
    siteUrl: siteUrl(),
    locale,
    description: seo('home.description', { price: formatPrice(cheapest, locale) }),
    facts,
    pricing,
    pages,
    otherLanguagePages,
    full,
    labels: {
      pages: seo('llms.pages'),
      prices: seo('llms.prices'),
      hourly: seo('llms.hourly'),
      fixed: seo('llms.fixed'),
      packFrom: seo('llms.packFrom'),
      weeks: (weeks: number) => seo('llms.weeks', { weeks }),
      contact: seo('llms.contact'),
      english: seo('llms.english'),
      author: seo('llms.author'),
      includes: seo('llms.includes'),
    },
  });
}
