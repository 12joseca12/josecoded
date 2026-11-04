import { profileLinks } from "@/config/profiles";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import {
  type BreadcrumbItem,
  type BreadcrumbListJsonLd,
  breadcrumbListSchema,
  type JsonLdGraph,
  jsonLdGraphSchema,
  type JsonLdNode,
  type PersonJsonLd,
  personSchema,
  type WebSiteJsonLd,
  webSiteSchema,
} from "@/types/seo";

import { absoluteUrl, localePath } from "./routes";

export function resolveProfileLinks(links: Record<string, string>): string[] {
  return Object.values(links).filter((link) => !link.includes("{{DATO"));
}

export function personId(origin: string): string {
  return absoluteUrl(origin, "/#person");
}

export function websiteId(origin: string): string {
  return absoluteUrl(origin, "/#website");
}

export async function buildPerson(
  origin: string,
  locale: Locale,
  links: Record<string, string> = profileLinks,
): Promise<PersonJsonLd> {
  const t = await getTranslator(locale);
  const sameAs = resolveProfileLinks(links);
  return personSchema.parse({
    "@type": "Person",
    "@id": personId(origin),
    name: t("seo.person.name"),
    alternateName: t("seo.person.alternateName"),
    jobTitle: t("seo.person.jobTitle"),
    description: t("seo.person.description"),
    url: absoluteUrl(origin, localePath(locale, "")),
    address: {
      "@type": "PostalAddress",
      addressLocality: t("seo.person.locality"),
      addressCountry: t("seo.person.countryCode"),
    },
    areaServed: [
      { "@type": "Country", name: t("seo.person.country") },
      { "@type": "Place", name: t("seo.person.remote") },
    ],
    ...(sameAs.length > 0 ? { sameAs } : {}),
  });
}

export async function buildWebSite(origin: string, locale: Locale): Promise<WebSiteJsonLd> {
  const t = await getTranslator(locale);
  return webSiteSchema.parse({
    "@type": "WebSite",
    "@id": websiteId(origin),
    url: absoluteUrl(origin, localePath(locale, "")),
    name: t("seo.website.name"),
    inLanguage: locale,
    publisher: { "@id": personId(origin) },
  });
}

export function buildBreadcrumbList(
  origin: string,
  items: readonly BreadcrumbItem[],
): BreadcrumbListJsonLd {
  return breadcrumbListSchema.parse({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(origin, item.path),
    })),
  });
}

export function buildGraph(...nodes: JsonLdNode[]): JsonLdGraph {
  return jsonLdGraphSchema.parse({ "@context": "https://schema.org", "@graph": nodes });
}

export async function buildSiteGraph(origin: string, locale: Locale): Promise<JsonLdGraph> {
  return buildGraph(await buildPerson(origin, locale), await buildWebSite(origin, locale));
}

export function serializeJsonLd(graph: JsonLdGraph): string {
  return JSON.stringify(jsonLdGraphSchema.parse(graph))
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll(" ", "\\u2028")
    .replaceAll(" ", "\\u2029");
}
