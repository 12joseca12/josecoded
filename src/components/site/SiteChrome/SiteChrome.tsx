import { type ReactNode, ViewTransition } from "react";

import { JsonLd } from "@/components/seo/JsonLd/JsonLd";
import { RouteFocus } from "@/components/site/RouteFocus/RouteFocus";
import { SiteFooter } from "@/components/site/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader/SiteHeader";
import { contentId, SkipLink } from "@/components/site/SkipLink/SkipLink";
import { contact } from "@/config/contact";
import { features } from "@/config/features";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { buildWhatsAppUrl } from "@/lib/contact/whatsapp";
import { buildSiteGraph } from "@/lib/seo/jsonld";
import type { HeaderLabels } from "@/types/nav";

const navSlugs: [string, MessageKey][] = [
  ["proyectos", "nav.projects"],
  ["servicios", "nav.services"],
  ["sobre-mi", "nav.about"],
  ["blog", "nav.blog"],
  ["contacto", "nav.contact"],
];

interface SiteChromeProps {
  locale: Locale;
  children: ReactNode;
}

export async function SiteChrome({ locale, children }: SiteChromeProps) {
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
    contact: {
      title: t("contactChooser.title"),
      close: t("contactChooser.close"),
      whatsapp: t("contactChooser.whatsapp"),
      whatsappHint: t("contactChooser.whatsappHint"),
      chat: t("contactChooser.chat"),
      chatHint: t("contactChooser.chatHint"),
      form: t("contactChooser.form"),
      formHint: t("contactChooser.formHint"),
    },
    chat: { label: t("chatButton.label") },
    search: { label: t("search.label"), shortcut: t("search.shortcut") },
  };
  const whatsappHref = buildWhatsAppUrl(
    contact.whatsappNumber,
    t("contactChooser.whatsappMessage"),
  );
  return (
    <>
      <JsonLd data={graph} />
      <SkipLink label={t("nav.skipLink")} />
      <SiteHeader
        locale={locale}
        items={items}
        labels={labels}
        whatsappHref={whatsappHref}
        searchEnabled={features.search}
      />
      <ViewTransition default="none" update="page-swap">
        <main id={contentId} tabIndex={-1}>
          {children}
        </main>
      </ViewTransition>
      <RouteFocus />
      <SiteFooter locale={locale} items={items} />
    </>
  );
}
