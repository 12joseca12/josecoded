import type { Metadata } from "next";

import type { SiteConfig } from "@/config/site";
import { isPublished, type Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";

import { ogContentType, ogImagePath, type OgPage, ogSize, ogTitleKeys } from "./og";
import { localePath, openGraphLocales } from "./routes";

interface PageSeo {
  locale: Locale;
  path: string;
  title: MessageKey;
  description: MessageKey;
  sameSegmentAsLayout?: boolean;
  indexable?: boolean;
  openGraphType?: "website" | "profile";
  ogImage?: OgPage;
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
  ogImage = "home",
}: PageSeo): Promise<Metadata> {
  if (!isPublished(locale)) return {};
  const t = await getTranslator(locale);
  const pageTitle = t(title);
  const pageDescription = t(description);
  const canonical = localePath(locale, path);
  const imageUrl = ogImagePath(locale, ogImage);
  const imageAlt = `${t(ogTitleKeys[ogImage])} · ${t("og.byline")}`;
  const socialTitle = applyTitleTemplate(t("meta.titleTemplate"), pageTitle);
  return {
    title: sameSegmentAsLayout ? { absolute: socialTitle } : pageTitle,
    description: pageDescription,
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    alternates: { canonical },
    openGraph: {
      type: openGraphType,
      siteName: t("meta.siteName"),
      locale: openGraphLocales[locale],
      url: canonical,
      title: socialTitle,
      description: pageDescription,
      images: [{ url: imageUrl, ...ogSize, alt: imageAlt, type: ogContentType }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: pageDescription,
      images: [{ url: imageUrl, alt: imageAlt }],
    },
  };
}
