import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";

import { absoluteUrl, localePath } from "./routes";

interface Rates {
  hour: string;
  task: string;
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export async function buildLlmsTxt(origin: string, locale: Locale, rates: Rates): Promise<string> {
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
  const lines = [
    `# ${t("seo.website.name")}`,
    "",
    `> ${t("seo.llms.summary")}`,
    "",
    `## ${t("seo.llms.servicesTitle")}`,
    "",
    `- ${t("seo.llms.hiring")}`,
    `- ${fill(t("seo.llms.freelance"), { hour: rates.hour, task: rates.task })}`,
    `- ${t("seo.llms.packs")}`,
    "",
    `## ${t("seo.llms.pagesTitle")}`,
    "",
    link(t("seo.llms.home"), ""),
    link(t("seo.llms.services"), "/servicios"),
    link(t("seo.llms.projects"), "/proyectos"),
    "",
    `## ${t("seo.llms.entityTitle")}`,
    "",
    `- ${fill(t("seo.llms.entityName"), person)}`,
    `- ${fill(t("seo.llms.entityJob"), person)}`,
    `- ${fill(t("seo.llms.entityPlace"), person)}`,
    `- ${fill(t("seo.llms.entityArea"), person)}`,
    `- ${t("seo.llms.entityLanguage")}`,
    "",
  ];
  return lines.join("\n");
}
