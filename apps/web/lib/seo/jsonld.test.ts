import { describe, expect, it } from 'vitest';

import { pricing } from '@josecoded/pricing';

import { serializeJsonLd } from '@/components/seo/json-ld';

import { readFacts } from './facts';
import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  graphOf,
  ids,
  organizationJsonLd,
  personJsonLd,
  serviceOfferJsonLd,
  siteGraph,
  softwareApplicationJsonLd,
  webProjectJsonLd,
} from './jsonld';

interface PriceNode {
  priceSpecification: Record<string, unknown> & { minPrice: number };
  itemOffered: { name: string };
  url: string;
}
interface ServiceNode {
  provider: unknown;
  areaServed: string;
  offers: { priceSpecification: Record<string, unknown> };
  hasOfferCatalog: { itemListElement: PriceNode[] };
}

const siteUrl = 'https://josecoded.com';
const facts = readFacts({
  givenNames: 'Ana',
  surnames: 'Prueba Ejemplo',
  city: 'Valencia',
  photo: '{{DATO: foto}}',
  email: 'hola@example.com',
  githubUser: 'ana-prueba',
  linkedinUrl: 'https://www.linkedin.com/in/ana-prueba',
});
const input = { siteUrl, locale: 'es' as const, facts, jobTitle: 'Desarrollador full-stack freelance' };

describe('site graph', () => {
  const graph = siteGraph(input);
  const byType = (type: string) => graph['@graph'].find((node) => [node['@type']].flat().includes(type));

  it('links Person, Organization and WebSite by stable @id', () => {
    const { person, organization, website } = ids(siteUrl);
    expect(byType('Person')).toMatchObject({ '@id': person, worksFor: { '@id': organization } });
    expect(byType('Organization')).toMatchObject({ '@id': organization, founder: { '@id': person } });
    expect(byType('WebSite')).toMatchObject({ '@id': website, publisher: { '@id': organization } });
  });

  it('Person states only real facts: name, https sameAs, mailto, city; the pending photo is left out', () => {
    expect(byType('Person')).toMatchObject({
      name: 'Ana Prueba Ejemplo',
      alternateName: 'josecoded',
      sameAs: ['https://www.linkedin.com/in/ana-prueba', 'https://github.com/ana-prueba'],
      email: 'mailto:hola@example.com',
      address: { addressCountry: 'ES', addressLocality: 'Valencia' },
    });
    expect(byType('Person')).not.toHaveProperty('image');
    expect(JSON.stringify(graph)).not.toMatch(/Jose Dev|\{\{DATO/);
  });

  it('WebSite has no SearchAction (there is no results page)', () => {
    expect(byType('WebSite')).not.toHaveProperty('potentialAction');
  });

  it('without a real name there is no Person and the Organization has no founder', () => {
    const bare = siteGraph({ ...input, facts: readFacts({ givenNames: '{{DATO: x}}', surnames: '{{DATO: y}}' }) });
    expect(bare['@graph'].map((n) => n['@type'])).toEqual([['Organization', 'ProfessionalService'], 'WebSite']);
    expect(organizationJsonLd({ ...input, facts: {} })).not.toHaveProperty('founder');
    expect(personJsonLd({ ...input, facts: {} })).toBeUndefined();
  });

  it('matches the snapshot', () => {
    expect(graph).toMatchSnapshot();
  });
});

describe('services and prices (coherence with @josecoded/pricing)', () => {
  const nodes = serviceOfferJsonLd({
    siteUrl,
    locale: 'es',
    pricing,
    servicesUrl: `${siteUrl}/servicios`,
    labels: { hourly: 'Por horas', fixed: 'Cerrado', packs: 'Packs' },
  });
  const [hourly, fixed, packs] = nodes as unknown as [ServiceNode, ServiceNode, ServiceNode];

  it('hourly rate is a UnitPriceSpecification per hour, without VAT', () => {
    expect(hourly.offers.priceSpecification).toEqual({
      '@type': 'UnitPriceSpecification',
      price: pricing.hourly,
      priceCurrency: 'EUR',
      unitCode: 'HUR',
      valueAddedTaxIncluded: false,
    });
    expect(hourly.provider).toEqual({ '@id': ids(siteUrl).person });
    expect(hourly.areaServed).toBe('ES');
  });

  it('the fixed-price feature starts at the price of pricing.json', () => {
    expect(fixed.offers.priceSpecification).toMatchObject({ minPrice: pricing.feature, valueAddedTaxIncluded: false });
  });

  it('the catalogue lists P1-P4, P5 and its extended version, every minPrice taken from pricing.json, no `price`', () => {
    const offers = packs.hasOfferCatalog.itemListElement;
    const expected = [...pricing.packs.map((p) => p.price), pricing.apps[0]!.price, pricing.apps[1]!.price];
    expect(offers.map((o) => o.priceSpecification.minPrice)).toEqual(expected);
    expect(offers).toHaveLength(6);
    expect(offers[1]!.priceSpecification.minPrice).toBe(1400);
    for (const offer of offers) {
      expect(offer.priceSpecification).toMatchObject({ priceCurrency: 'EUR', valueAddedTaxIncluded: false });
      expect(offer.priceSpecification).not.toHaveProperty('price');
      expect(offer.url).toMatch(/^https:\/\/josecoded\.com\/servicios\?pack=P\d#packs$/);
    }
  });

  it('falls back to the pack code while a translation is pending', () => {
    const en = serviceOfferJsonLd({ siteUrl, locale: 'en', pricing, servicesUrl: `${siteUrl}/en/services`, labels: { hourly: 'h', fixed: 'f', packs: 'p' } });
    const offers = (en[2] as unknown as ServiceNode).hasOfferCatalog.itemListElement;
    expect(offers[0]?.itemOffered.name).toBe('P1');
    expect(JSON.stringify(en)).not.toContain('{{DATO');
  });
});

describe('faqJsonLd', () => {
  it('exists only with real answers and drops pending entries', () => {
    expect(faqJsonLd([])).toBeUndefined();
    expect(faqJsonLd([{ question: '¿Hay IVA?', answer: '{{DATO: respuesta}}' }])).toBeUndefined();
    const faq = faqJsonLd([
      { question: '¿Hay IVA?', answer: 'Los precios no incluyen IVA.' },
      { question: '¿NDA?', answer: '{{DATO: respuesta}}' },
    ]);
    expect(faq?.mainEntity).toHaveLength(1);
  });
});

describe('other nodes', () => {
  it('breadcrumb positions start at 1', () => {
    const list = breadcrumbJsonLd([{ name: 'Inicio', url: siteUrl }, { name: 'Proyectos', url: `${siteUrl}/proyectos` }]);
    expect((list.itemListElement as { position: number }[]).map((i) => i.position)).toEqual([1, 2]);
  });

  it('SoftwareApplication carries no rating, offers or downloads', () => {
    const app = softwareApplicationJsonLd({ siteUrl, name: 'App', url: `${siteUrl}/proyectos/app`, operatingSystem: 'iOS, Android', applicationCategory: '{{DATO: cat}}' });
    expect(Object.keys(app)).not.toEqual(expect.arrayContaining(['aggregateRating', 'offers']));
    expect(app).not.toHaveProperty('applicationCategory');
  });

  it('BlogPosting points at the person and the organization by @id', () => {
    const post = blogPostingJsonLd({ siteUrl, locale: 'es', url: `${siteUrl}/blog/x`, headline: 'h', description: 'd', datePublished: '2026-10-01', dateModified: '2026-10-02' });
    expect(post).toMatchObject({ '@type': ['BlogPosting', 'TechArticle'], author: { '@id': ids(siteUrl).person } });
  });

  it('the article has its own @id, belongs to the WebSite and carries keywords and level when it has them', () => {
    const post = blogPostingJsonLd({ siteUrl, locale: 'en', url: `${siteUrl}/en/blog/x`, headline: 'h', description: 'd', datePublished: '2026-10-01', dateModified: '2026-10-01', keywords: ['nextjs', 'i18n'], proficiencyLevel: 'Intermediate' });
    expect(post).toMatchObject({ '@id': `${siteUrl}/en/blog/x#article`, isPartOf: { '@id': ids(siteUrl).website }, keywords: 'nextjs, i18n', proficiencyLevel: 'Intermediate', inLanguage: 'en' });
  });

  it('a pending description is dropped, never published', () => {
    const post = blogPostingJsonLd({ siteUrl, locale: 'es', url: `${siteUrl}/blog/x`, headline: 'h', description: '{{DATO: frase}}', datePublished: '2026-10-01', dateModified: '2026-10-01' });
    expect(post).not.toHaveProperty('description');
    expect(JSON.stringify(post)).not.toContain('DATO');
  });

  it('serialises without a way out of the script element', () => {
    const html = serializeJsonLd(graphOf({ '@type': 'Thing', name: '</script><script>alert(1)</script>' }));
    expect(html).not.toContain('</script>');
    expect((JSON.parse(html) as { '@graph': { name: string }[] })['@graph'][0]?.name).toBe('</script><script>alert(1)</script>');
  });

  it('a web case study is a WebApplication or a CreativeWork with its own @id, never a WebSite', () => {
    const live = webProjectJsonLd({ siteUrl, name: 'Web', url: `${siteUrl}/proyectos/web`, webUrl: 'https://web.example' });
    expect(live).toMatchObject({ '@type': 'WebApplication', '@id': `${siteUrl}/proyectos/web#project`, url: 'https://web.example' });
    const offline = webProjectJsonLd({ siteUrl, name: 'Web', url: `${siteUrl}/proyectos/web` });
    expect(offline).toMatchObject({ '@type': 'CreativeWork', url: `${siteUrl}/proyectos/web` });
    expect(JSON.stringify([live, offline])).not.toContain('WebSite');
  });
});
