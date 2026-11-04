import type { Metadata } from "next";

import { isPublished, type Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";

import { localePath, openGraphLocales } from "./routes";

interface PageSeo {
  locale: Locale;
  path: string;
  title: MessageKey;
  description: MessageKey;
  sameSegmentAsLayout?: boolean;
}

export function applyTitleTemplate(template: string, title: string): string {
  return template.replace("%s", title);
}

export async function buildPageMetadata({
  locale,
  path,
  title,
  description,
  sameSegmentAsLayout = false,
}: PageSeo): Promise<Metadata> {
  if (!isPublished(locale)) return {};
  const t = await getTranslator(locale);
  const pageTitle = t(title);
  const pageDescription = t(description);
  const canonical = localePath(locale, path);
  const socialTitle = applyTitleTemplate(t("meta.titleTemplate"), pageTitle);
  return {
    title: sameSegmentAsLayout ? { absolute: socialTitle } : pageTitle,
    description: pageDescription,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: t("meta.siteName"),
      locale: openGraphLocales[locale],
      url: canonical,
      title: socialTitle,
      description: pageDescription,
    },
    twitter: { card: "summary", title: socialTitle, description: pageDescription },
  };
}
