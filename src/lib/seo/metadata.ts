import type { Metadata } from "next";

import type { SiteConfig } from "@/config/site";
import { isPublished, type Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";

import { localePath, openGraphLocales } from "./routes";

export interface Literal {
  literal: string;
}

export interface ArticleDates {
  published: string;
  modified: string;
}

interface PageSeo {
  locale: Locale;
  path: string;
  title: MessageKey | Literal;
  description: MessageKey | Literal;
  sameSegmentAsLayout?: boolean;
  indexable?: boolean;
  openGraphType?: "website" | "profile" | "article";
  article?: ArticleDates;
}

export function resolveRobots(site: SiteConfig): Metadata["robots"] {
  return site.indexable ? undefined : { index: false, follow: false };
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
  indexable = true,
  openGraphType = "website",
  article,
}: PageSeo): Promise<Metadata> {
  if (!isPublished(locale)) return {};
  const t = await getTranslator(locale);
  const resolve = (value: MessageKey | Literal) =>
    typeof value === "string" ? t(value) : value.literal;
  const pageTitle = resolve(title);
  const pageDescription = resolve(description);
  const canonical = localePath(locale, path);
  const socialTitle = applyTitleTemplate(t("meta.titleTemplate"), pageTitle);
  return {
    title: sameSegmentAsLayout ? { absolute: socialTitle } : pageTitle,
    description: pageDescription,
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    alternates: { canonical },
    openGraph: {
      siteName: t("meta.siteName"),
      locale: openGraphLocales[locale],
      url: canonical,
      title: socialTitle,
      description: pageDescription,
      ...(openGraphType === "article" && article
        ? {
            type: "article" as const,
            publishedTime: article.published,
            modifiedTime: article.modified,
          }
        : { type: openGraphType === "article" ? ("website" as const) : openGraphType }),
    },
    twitter: { card: "summary", title: socialTitle, description: pageDescription },
  };
}
