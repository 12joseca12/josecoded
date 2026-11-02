// Structured data as one graph with stable `@id`s (SEO/GEO analysis 2026-10-31, §3): the layout emits Person, Organization
// and WebSite once and every other node points at them by `@id`. Pure functions of their input: no Next, no env, so
// they are tested with plain objects. Nothing is stated that the page does not also say, and nothing that is still a
// `{{DATO}}`: a missing fact drops the field (or the node), it is never invented.
//
// Deviations from the plan text (decided in the analysis): WebSite has NO SearchAction (there is no results page, and
// Google retired the sitelinks search box); FAQPage exists only with real answers.
import { hasDato } from '@/lib/content/dato';

import { fullName, sameAs } from './facts';

import type { SiteFacts } from './facts';
import type { Locale, PricingData } from '@josecoded/types';

export type JsonLdNode = Record<string, unknown>;
export interface JsonLdGraph {
  '@context': 'https://schema.org';
  '@graph': JsonLdNode[];
}

export const ids = (siteUrl: string) => ({
  person: `${siteUrl}/#person`,
  organization: `${siteUrl}/#organization`,
  website: `${siteUrl}/#website`,
});

export const BRAND = 'josecoded';

/** Fields with a value only: `undefined` and empty arrays leave no key behind. */
function compact<T extends JsonLdNode>(node: T): T {
  return Object.fromEntries(
    Object.entries(node).filter(([, value]) => value !== undefined && !(Array.isArray(value) && value.length === 0)),
  ) as T;
}

export interface SiteJsonLdInput {
  siteUrl: string;
  locale: Locale;
  facts: SiteFacts;
  jobTitle: string;
  /** One-line citable description; `{{DATO}}` or empty drops it. */
  description?: string;
  knowsAbout?: string[];
}

export const KNOWS_ABOUT = [
  'TypeScript',
  'Next.js',
  'React Native',
  'Expo',
  'Supabase',
  'Cloudflare Workers',
  'Web accessibility',
  'AI integration',
] as const;

/** `Person` needs a real name: without it there is no node (the brand `Organization` still stands). */
export function personJsonLd({ siteUrl, facts, jobTitle, description, knowsAbout = [...KNOWS_ABOUT] }: SiteJsonLdInput): JsonLdNode | undefined {
  const name = fullName(facts);
  if (!name) return undefined;
  const { person, organization } = ids(siteUrl);
  return compact({
    '@type': 'Person',
    '@id': person,
    name,
    alternateName: BRAND,
    url: siteUrl,
    image: facts.photo,
    jobTitle,
    description: description && hasDato(description) ? description : undefined,
    knowsAbout,
    knowsLanguage: ['es', 'en'],
    address: facts.city ? { '@type': 'PostalAddress', addressCountry: 'ES', addressLocality: facts.city } : undefined,
    email: facts.email ? `mailto:${facts.email}` : undefined,
    sameAs: sameAs(facts),
    worksFor: { '@id': organization },
  });
}

export function organizationJsonLd({ siteUrl, facts }: SiteJsonLdInput): JsonLdNode {
  const { person, organization } = ids(siteUrl);
  return compact({
    '@type': ['Organization', 'ProfessionalService'],
    '@id': organization,
    name: BRAND,
    url: siteUrl,
    founder: fullName(facts) ? { '@id': person } : undefined,
    areaServed: ['ES'],
    // GitHub profile is a person-level fact; an organization account would be added here when it exists
  });
}

export function webSiteJsonLd({ siteUrl, locale }: SiteJsonLdInput): JsonLdNode {
  const { organization, website } = ids(siteUrl);
  return {
    '@type': 'WebSite',
    '@id': website,
    name: BRAND,
    url: siteUrl,
    inLanguage: locale,
    publisher: { '@id': organization },
  };
}

/** The site-wide graph the locale layout emits. */
export function siteGraph(input: SiteJsonLdInput): JsonLdGraph {
  const person = personJsonLd(input);
  return {
    '@context': 'https://schema.org',
    '@graph': [...(person ? [person] : []), organizationJsonLd(input), webSiteJsonLd(input)],
  };
}

export function profilePageJsonLd({ siteUrl, url, dateModified }: { siteUrl: string; url: string; dateModified?: string }): JsonLdNode {
  return compact({
    '@type': 'ProfilePage',
    '@id': `${url}#profile`,
    url,
    mainEntity: { '@id': ids(siteUrl).person },
    isPartOf: { '@id': ids(siteUrl).website },
    dateModified,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Services and prices: every number comes from @josecoded/pricing; the tests compare node and file.

export interface ServicesJsonLdInput {
  siteUrl: string;
  locale: Locale;
  pricing: PricingData;
  /** Absolute URL of the services page in this locale (the `?pack=` links and anchors hang from it). */
  servicesUrl: string;
  labels: { hourly: string; fixed: string; packs: string };
  /** The `id` of each way's section in this language (`por-hora` / `hourly`). The anchors are not the same in es and en. */
  anchors?: { hourly: string; fixed: string; packs: string };
}

const EUR = 'EUR';

const minPrice = (price: number) => ({
  '@type': 'PriceSpecification',
  minPrice: price,
  priceCurrency: EUR,
  valueAddedTaxIncluded: false,
});

/** The name in this language, or the code while the translation is still a `{{DATO}}`. */
const offerName = (text: { es: string; en: string }, locale: Locale, fallback: string) =>
  hasDato(text[locale]) ? text[locale] : fallback;

/**
 * Hourly rate, fixed-price feature and the pack catalogue: P1-P4 (web) and P5 (apps: MVP from `apps[0]`, and the
 * extended one as a sixth offer). Prices exclude VAT (`valueAddedTaxIncluded: false`) and carry no `price` for packs,
 * only `minPrice`: they are "from" prices.
 */
export function serviceOfferJsonLd({ siteUrl, locale, pricing, servicesUrl, labels, anchors = { hourly: 'hourly', fixed: 'fixed', packs: 'packs' } }: ServicesJsonLdInput): JsonLdNode[] {
  const provider = { '@id': ids(siteUrl).person };
  const common = { provider, areaServed: 'ES' } as const;

  const packOffer = (code: string, name: { es: string; en: string }, price: number, query: string) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: offerName(name, locale, code) },
    priceSpecification: minPrice(price),
    url: `${servicesUrl}?pack=${query}#${anchors.packs}`,
  });
  const [appMvp, appPlus] = pricing.apps;

  return [
    {
      '@type': 'Service',
      '@id': `${servicesUrl}#${anchors.hourly}`,
      name: labels.hourly,
      serviceType: 'Software development',
      ...common,
      url: `${servicesUrl}#${anchors.hourly}`,
      offers: {
        '@type': 'Offer',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: pricing.hourly,
          priceCurrency: EUR,
          unitCode: 'HUR',
          valueAddedTaxIncluded: false,
        },
      },
    },
    {
      '@type': 'Service',
      '@id': `${servicesUrl}#${anchors.fixed}`,
      name: labels.fixed,
      serviceType: 'Software development',
      ...common,
      url: `${servicesUrl}#${anchors.fixed}`,
      offers: { '@type': 'Offer', priceSpecification: minPrice(pricing.feature) },
    },
    {
      '@type': 'Service',
      '@id': `${servicesUrl}#${anchors.packs}`,
      name: labels.packs,
      serviceType: 'Web and mobile app development',
      ...common,
      url: `${servicesUrl}#${anchors.packs}`,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: labels.packs,
        itemListElement: [
          ...pricing.packs.map((pack) => packOffer(pack.code, pack.name, pack.price, pack.code)),
          ...(appMvp ? [packOffer('P5', appMvp.name, appMvp.price, 'P5')] : []),
          ...(appPlus ? [packOffer('P5+', appPlus.name, appPlus.price, 'P5')] : []),
        ],
      },
    },
  ];
}

// ---------------------------------------------------------------------------------------------------------------

export interface FaqItem {
  question: string;
  answer: string;
}

/** `FAQPage` only when there is at least one entry and every shown answer is real: a pending answer drops its entry. */
export function faqJsonLd(items: FaqItem[]): JsonLdNode | undefined {
  const real = items.filter((item) => hasDato(item.question) && hasDato(item.answer));
  if (real.length === 0) return undefined;
  return {
    '@type': 'FAQPage',
    mainEntity: real.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): JsonLdNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })),
  };
}

/** Name and links only: no ratings, offers or download counts (the site publishes no metrics). */
export function softwareApplicationJsonLd(app: {
  siteUrl: string;
  name: string;
  url: string;
  operatingSystem: string;
  applicationCategory?: string;
  installUrls?: string[];
}): JsonLdNode {
  return compact({
    '@type': 'SoftwareApplication',
    name: app.name,
    url: app.url,
    operatingSystem: app.operatingSystem,
    applicationCategory: app.applicationCategory && hasDato(app.applicationCategory) ? app.applicationCategory : undefined,
    installUrl: app.installUrls,
    author: { '@id': ids(app.siteUrl).person },
  });
}

/**
 * A web case study: the product is a `WebApplication` when it has its own address, otherwise a `CreativeWork`
 * (a project the visitor cannot open). Never a `WebSite`: the only one is the site's own, with its stable `@id`.
 * The node has its own `@id` (`<case url>#project`) so the graph can point at it.
 */
export function webProjectJsonLd(project: { siteUrl: string; name: string; url: string; webUrl?: string }): JsonLdNode {
  return {
    '@type': project.webUrl ? 'WebApplication' : 'CreativeWork',
    '@id': `${project.url}#project`,
    name: project.name,
    url: project.webUrl ?? project.url,
    author: { '@id': ids(project.siteUrl).person },
    ...(project.webUrl ? { mainEntityOfPage: project.url } : {}),
  };
}

export function blogPostingJsonLd(post: {
  siteUrl: string;
  locale: Locale;
  url: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  image?: string;
  proficiencyLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  keywords?: readonly string[];
}): JsonLdNode {
  const { person, organization, website } = ids(post.siteUrl);
  return compact({
    '@type': ['BlogPosting', 'TechArticle'],
    '@id': `${post.url}#article`,
    headline: post.headline,
    description: hasDato(post.description) ? post.description : undefined,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: { '@id': person },
    publisher: { '@id': organization },
    image: post.image,
    inLanguage: post.locale,
    proficiencyLevel: post.proficiencyLevel,
    keywords: post.keywords?.length ? post.keywords.join(', ') : undefined,
    isPartOf: { '@id': website },
    mainEntityOfPage: post.url,
  });
}

/** One `<script>` payload: nodes of a page wrapped in the shared context. */
export const graphOf = (...nodes: (JsonLdNode | undefined)[]): JsonLdGraph => ({
  '@context': 'https://schema.org',
  '@graph': nodes.filter((node): node is JsonLdNode => node !== undefined),
});
