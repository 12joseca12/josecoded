import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/transitions.css";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { canonicalOrigin, site } from "@/config/site";
import { isLocale, isPublished, locales } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { resolveRobots } from "@/lib/seo/metadata";
import { openGraphLocales } from "@/lib/seo/routes";
import { interTight } from "@/styles/font";

interface LocaleProps {
  params: Promise<{ locale: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || !isPublished(locale)) return {};
  const t = await getTranslator(locale);
  return {
    metadataBase: new URL(canonicalOrigin),
    title: { default: t("meta.title"), template: t("meta.titleTemplate") },
    description: t("meta.description"),
    robots: resolveRobots(site),
    openGraph: {
      type: "website",
      siteName: t("meta.siteName"),
      locale: openGraphLocales[locale],
      title: t("meta.title"),
      description: t("meta.description"),
    },
    twitter: { card: "summary", title: t("meta.title"), description: t("meta.description") },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleProps & { children: ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale) || !isPublished(locale)) notFound();
  return (
    <html lang={locale} className={interTight.variable}>
      <body>{children}</body>
    </html>
  );
}
