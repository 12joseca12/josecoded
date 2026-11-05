import { contact } from "@/config/contact";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { postPath } from "@/lib/blog/posts";
import { publicRates, type Rates } from "@/lib/services/rates";
import type { ContactWay } from "@/types/contact";

import { absoluteUrl, localePath } from "./routes";

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export interface LlmsGuide {
  slug: string;
  title: string;
  description: string;
}

export async function buildLlmsTxt(
  origin: string,
  locale: Locale,
  rates: Rates,
  ways: readonly ContactWay[] = contact.ways,
  hasProjects = false,
  guides: readonly LlmsGuide[] = [],
): Promise<string> {
  const t = await getTranslator(locale);
  const link = (label: string, path: string) =>
    `- [${label}](${absoluteUrl(origin, localePath(locale, path))})`;
  const person = {
    name: t("seo.person.name"),
    alias: t("seo.person.alternateName"),
    jobTitle: t("seo.person.jobTitle"),
    locality: t("seo.person.locality"),
    country: t("seo.person.country"),
  };
  const prices = publicRates(rates);
  const rateLines = prices
    ? [
        `- ${fill(t("seo.llms.rateHour"), { hour: prices.hour })}`,
        `- ${fill(t("seo.llms.rateTask"), { task: prices.task })}`,
      ]
    : [];
  const wayTitles = {
    contratacion: t("contactPage.ways.contratacion.title"),
    freelance: t("contactPage.ways.freelance.title"),
    project: t("contactPage.ways.project.title"),
  };
  const hasContact = ways.length > 0;
  const contactLines = hasContact
    ? [
        `## ${t("seo.llms.contactTitle")}`,
        "",
        ...ways.map(
          (entry) =>
            `- ${fill(t("seo.llms.contactLine"), { way: wayTitles[entry.way], email: entry.email })}`,
        ),
        "",
      ]
    : [];
  const guideLines =
    guides.length > 0
      ? [
          `## ${t("seo.llms.guidesTitle")}`,
          "",
          ...guides.map(
            (guide) => `${link(guide.title, postPath(guide.slug))}: ${guide.description}`,
          ),
          "",
        ]
      : [];
  const lines = [
    `# ${t("seo.website.name")}`,
    "",
    `> ${t("seo.llms.summary")}`,
    "",
    `## ${t("seo.llms.servicesTitle")}`,
    "",
    `- ${t("seo.llms.hiring")}`,
    `- ${t("seo.llms.freelance")}`,
    ...rateLines,
    `- ${t("seo.llms.project")}`,
    "",
    `## ${t("seo.llms.pagesTitle")}`,
    "",
    link(t("seo.llms.home"), ""),
    link(t("seo.llms.services"), "/servicios"),
    link(t("seo.llms.freelancePage"), "/servicios/freelance"),
    link(t("seo.llms.offersPage"), "/servicios/a-medida"),
    link(t("seo.llms.howPage"), "/como-trabajo"),
    ...(hasProjects ? [link(t("seo.llms.projects"), "/proyectos")] : []),
    link(t("seo.llms.about"), "/sobre-mi"),
    ...(guides.length > 0 ? [link(t("seo.llms.blog"), "/blog")] : []),
    ...(hasContact ? [link(t("seo.llms.contact"), "/contacto")] : []),
    "",
    ...guideLines,
    `## ${t("seo.llms.entityTitle")}`,
    "",
    `- ${fill(t("seo.llms.entityName"), person)}`,
    `- ${fill(t("seo.llms.entityJob"), person)}`,
    `- ${fill(t("seo.llms.entityPlace"), person)}`,
    `- ${fill(t("seo.llms.entityArea"), person)}`,
    `- ${t("seo.llms.entityLanguage")}`,
    "",
    ...contactLines,
  ];
  return lines.join("\n");
}
