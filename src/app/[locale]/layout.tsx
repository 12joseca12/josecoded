import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/transitions.css";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type ReactNode, ViewTransition } from "react";

import { JsonLd } from "@/components/seo/JsonLd/JsonLd";
import { RouteFocus } from "@/components/site/RouteFocus/RouteFocus";
import { SiteFooter } from "@/components/site/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader/SiteHeader";
import { contentId, SkipLink } from "@/components/site/SkipLink/SkipLink";
import { site } from "@/config/site";
import { isLocale, isPublished, locales } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { buildSiteGraph } from "@/lib/seo/jsonld";
import { openGraphLocales } from "@/lib/seo/routes";
import { interTight } from "@/styles/font";
import type { HeaderLabels } from "@/types/nav";

const navSlugs: [string, MessageKey][] = [
  ["proyectos", "nav.projects"],
  ["servicios", "nav.services"],
  ["sobre-mi", "nav.about"],
  ["blog", "nav.blog"],
  ["contacto", "nav.contact"],
];

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
    metadataBase: new URL(site.origin),
    title: { default: t("meta.title"), template: t("meta.titleTemplate") },
    description: t("meta.description"),
    robots: site.indexable ? undefined : { index: false, follow: false },
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
  const t = await getTranslator(locale);
  const graph = await buildSiteGraph(site.origin, locale);
  const items = navSlugs.map(([slug, key]) => ({ slug, label: t(key) }));
  const labels: HeaderLabels = {
    brandLabel: t("nav.brandLabel"),
    brandWord: t("nav.brandWord"),
    navLabel: t("nav.navLabel"),
    home: t("nav.home"),
    cta: t("nav.cta"),
    loading: t("nav.loading"),
    menuOpen: t("nav.menuOpen"),
    menuClose: t("nav.menuClose"),
    menuTitle: t("nav.menuTitle"),
    here: t("nav.here"),
  };
  return (
    <html lang={locale} className={interTight.variable}>
      <body>
        <JsonLd data={graph} />
        <SkipLink label={t("nav.skipLink")} />
        <SiteHeader locale={locale} items={items} labels={labels} />
        <ViewTransition default="none" update="page-swap">
          <main id={contentId} tabIndex={-1}>
            {children}
          </main>
        </ViewTransition>
        <RouteFocus />
        <SiteFooter locale={locale} items={items} />
      </body>
    </html>
  );
}
