import { contact } from "@/config/contact";
import { profileLinks } from "@/config/profiles";
import { getCv } from "@/content";
import type { Cv } from "@/content/schemas";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { resolvePersonFacts } from "@/lib/about/cv";
import { primaryEmail } from "@/lib/contact/channels";
import type { ContactWay } from "@/types/contact";
import {
  type BreadcrumbListJsonLd,
  breadcrumbListSchema,
  type FaqPageJsonLd,
  faqPageSchema,
  type JsonLdGraph,
  jsonLdGraphSchema,
  type JsonLdNode,
  type PersonJsonLd,
  personSchema,
  type ProfilePageJsonLd,
  profilePageSchema,
  type WebSiteJsonLd,
  webSiteSchema,
} from "@/types/seo";
import type { FaqItem } from "@/types/services";

import { absoluteUrl, localePath } from "./routes";

export function resolveProfileLinks(links: Record<string, string>): string[] {
  return Object.values(links).filter((link) => !link.includes("{{DATO"));
}

const personLanguages = ["es", "en"] as const;

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
  ways: readonly ContactWay[] = contact.ways,
  cv: Cv = getCv(),
): Promise<PersonJsonLd> {
  const t = await getTranslator(locale);
  const sameAs = resolveProfileLinks(links);
  const email = primaryEmail(ways);
  const facts = resolvePersonFacts(cv);
  return personSchema.parse({
    "@type": "Person",
    "@id": personId(origin),
    name: t("seo.person.name"),
    givenName: t("seo.person.givenName"),
    familyName: t("seo.person.familyName"),
    alternateName: [t("seo.person.alternateName")],
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
    ...(email === null ? {} : { email }),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(facts.knowsAbout.length > 0 ? { knowsAbout: facts.knowsAbout } : {}),
    knowsLanguage: [...personLanguages],
    ...(facts.worksFor === null
      ? {}
      : { worksFor: { "@type": "Organization", name: facts.worksFor } }),
    ...(facts.alumniOf.length > 0
      ? {
          alumniOf: facts.alumniOf.map((name) => ({ "@type": "EducationalOrganization", name })),
        }
      : {}),
    ...(facts.credentials.length > 0
      ? {
          hasCredential: facts.credentials.map((credential) => ({
            "@type": "EducationalOccupationalCredential",
            name: credential.name,
            ...(credential.issuer === null
              ? {}
              : { recognizedBy: { "@type": "Organization", name: credential.issuer } }),
          })),
        }
      : {}),
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

export function buildProfilePage(
  origin: string,
  locale: Locale,
  path: string,
  copy: { name: string; description: string },
  dateModified?: string,
): ProfilePageJsonLd {
  const url = absoluteUrl(origin, localePath(locale, path));
  return profilePageSchema.parse({
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    name: copy.name,
    description: copy.description,
    inLanguage: locale,
    ...(dateModified === undefined ? {} : { dateModified }),
    isPartOf: { "@id": websiteId(origin) },
    mainEntity: { "@id": personId(origin) },
  });
}

export interface BreadcrumbEntry {
  name: string;
  path: string;
}

export function buildBreadcrumbList(
  origin: string,
  entries: readonly BreadcrumbEntry[],
): BreadcrumbListJsonLd {
  return breadcrumbListSchema.parse({
    "@type": "BreadcrumbList",
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(origin, entry.path),
    })),
  });
}

export function buildFaqPage(items: readonly FaqItem[]): FaqPageJsonLd {
  return faqPageSchema.parse({
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
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
