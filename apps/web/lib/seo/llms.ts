// llms.txt and llms-full.txt (task 2.11). Honest about its value: Google ignores the file and no provider has confirmed it
// reads it (SEO/GEO analysis §4.1), so it only repeats what the pages already say, at no cost. Built from the same
// sources as the pages (messages, pricing, facts); every line that still holds a `{{DATO}}` is dropped, so nothing the
// site does not state yet can leak. Pure function: `app/llms.txt/route.ts` feeds it.
import { formatPrice } from '@josecoded/pricing';

import { hasDato } from '@/lib/content/dato';

import { fullName, sameAs } from './facts';

import type { SiteFacts } from './facts';
import type { Locale, PricingData } from '@josecoded/types';

export interface LlmsPage {
  title: string;
  url: string;
  /** Optional one-line summary; dropped while pending. */
  summary?: string;
}

export interface LlmsInput {
  siteUrl: string;
  locale: Locale;
  /** The description of the home (same words as the meta description). */
  description: string;
  facts: SiteFacts;
  pricing: PricingData;
  pages: LlmsPage[];
  /** Pages in the other language, under their own heading. */
  otherLanguagePages: LlmsPage[];
  labels: {
    pages: string;
    prices: string;
    hourly: string;
    fixed: string;
    packFrom: string;
    weeks: (weeks: number) => string;
    contact: string;
    english: string;
    author: string;
    includes: string;
  };
  /** `llms-full.txt`: adds what each pack includes and every profile link. */
  full: boolean;
}

const real = (line: string) => !line.includes('{{DATO');

export function buildLlms({ siteUrl, locale, description, facts, pricing, pages, otherLanguagePages, labels, full }: LlmsInput): string {
  const price = (amount: number) => formatPrice(amount, locale);
  const link = (page: LlmsPage) => `- [${page.title}](${page.url})${page.summary && hasDato(page.summary) ? `: ${page.summary}` : ''}`;
  const name = fullName(facts);

  const packs = [...pricing.packs, ...pricing.apps].flatMap((pack) => {
    const title = hasDato(pack.name[locale]) ? pack.name[locale] : pack.code;
    const lines = [`- ${title}: ${labels.packFrom} ${price(pack.price)} (${labels.weeks(pack.weeks)})`];
    const includes = pack.includes[locale].filter(hasDato);
    if (full && includes.length > 0) lines.push(`  - ${labels.includes}: ${includes.join('; ')}`);
    return lines;
  });

  const lines = [
    '# josecoded',
    '',
    `> ${description}`,
    '',
    ...(name ? [`${labels.author}: ${name}`, ''] : []),
    `## ${labels.pages}`,
    ...pages.map(link),
    '',
    `## ${labels.prices}`,
    `- ${labels.hourly}: ${price(pricing.hourly)}/h`,
    `- ${labels.fixed} ${price(pricing.feature)}`,
    ...packs,
    ...(otherLanguagePages.length > 0 ? ['', `## ${labels.english}`, ...otherLanguagePages.map(link)] : []),
    ...(full
      ? [
          '',
          `## ${labels.contact}`,
          ...(facts.email ? [`- Email: ${facts.email}`] : []),
          ...sameAs(facts).map((url) => `- ${url}`),
          `- ${siteUrl}`,
        ]
      : []),
  ];
  return `${lines.filter(real).join('\n')}\n`;
}
