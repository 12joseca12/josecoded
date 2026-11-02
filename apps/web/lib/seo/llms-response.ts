import { getTranslations } from 'next-intl/server';

import { formatPrice, pricing } from '@josecoded/pricing';

import { blogPosts } from '@/lib/content/blog';
import { hasDato } from '@/lib/content/dato';
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

/** The real guides written in `locale` (a guide that only exists in the other language is listed under that one). */
function guidesOf(locale: Locale): LlmsPage[] {
  if (!getSectionAvailability().blog) return [];
  return blogPosts(locale, false)
    .filter((post) => !post.fallback && hasDato(post.title) && hasDato(post.description))
    .map((post) => ({ title: post.title, url: absoluteUrl(locale, '/blog/[slug]', { slug: post.slug }), summary: post.description }));
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
    otherLanguagePages: full ? [...otherLanguagePages, ...guidesOf('en')] : otherLanguagePages,
    guides: guidesOf(locale),
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
      guides: seo('llms.guides'),
    },
  });
}
