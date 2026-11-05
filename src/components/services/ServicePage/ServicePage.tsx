import { headers } from "next/headers";
import type { ReactNode } from "react";

import { JsonLd } from "@/components/seo/JsonLd/JsonLd";
import { BlockScroll } from "@/components/site/BlockScroll/BlockScroll";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { nonceHeader } from "@/lib/security/nonce";
import {
  buildBreadcrumbList,
  buildFaqPage,
  buildGraph,
  buildProfessionalService,
} from "@/lib/seo/jsonld";
import { localePath } from "@/lib/seo/routes";
import type { FaqItem, ServicePageId, WayId, WayNavItem } from "@/types/services";

import { WayNav } from "../WayNav/WayNav";
import styles from "./ServicePage.module.css";

interface ServicePageProps {
  locale: Locale;
  page: ServicePageId;
  head: { title: MessageKey; accent?: MessageKey; lead: MessageKey };
  faq: FaqItem[];
  children: ReactNode;
}

const pagePaths: Record<ServicePageId, string> = {
  hub: "/servicios",
  freelance: "/servicios/freelance",
  offers: "/servicios/a-medida",
};

const pageLabels: Record<Exclude<ServicePageId, "hub">, MessageKey> = {
  freelance: "services.ways.freelance.nav",
  offers: "services.ways.project.nav",
};

const wayLabels: Record<WayId, MessageKey> = {
  contratacion: "services.ways.contratacion.nav",
  freelance: "services.ways.freelance.nav",
  project: "services.ways.project.nav",
};

const wayIds = ["contratacion", "freelance", "project"] as const satisfies readonly WayId[];

const wayCopy: Record<WayId, { title: MessageKey; text: MessageKey }> = {
  contratacion: {
    title: "services.ways.contratacion.title",
    text: "services.ways.contratacion.text",
  },
  freelance: { title: "services.ways.freelance.title", text: "services.ways.freelance.text" },
  project: { title: "services.ways.project.title", text: "services.ways.project.text" },
};

export async function ServicePage({ locale, page, head, faq, children }: ServicePageProps) {
  const [t, requestHeaders] = await Promise.all([getTranslator(locale), headers()]);
  const nonce = requestHeaders.get(nonceHeader) ?? undefined;
  const hubPath = localePath(locale, pagePaths.hub);
  const childLabel = page === "hub" ? null : t(pageLabels[page]);

  const crumbs = [
    { label: t("nav.home"), href: localePath(locale, "") },
    { label: t("nav.services"), href: hubPath },
    ...(childLabel ? [{ label: childLabel, href: localePath(locale, pagePaths[page]) }] : []),
  ];

  const onHub = page === "hub";
  const navItems: WayNavItem[] = [
    {
      id: "contratacion",
      label: t(wayLabels.contratacion),
      href: localePath(locale, "/sobre-mi"),
    },
    {
      id: "freelance",
      label: t(wayLabels.freelance),
      href: localePath(locale, pagePaths.freelance),
    },
    {
      id: "project",
      label: t(wayLabels.project),
      href: localePath(locale, pagePaths.offers),
    },
  ];

  const service = onHub
    ? await buildProfessionalService(
        site.origin,
        locale,
        pagePaths.hub,
        wayIds.map((id) => ({
          name: t(wayCopy[id].title),
          description: t(wayCopy[id].text),
        })),
        { catalogName: t("nav.services") },
      )
    : null;
  const graph = buildGraph(
    buildBreadcrumbList(
      site.origin,
      crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
    ),
    buildFaqPage(faq),
    ...(service ? [service] : []),
  );

  return (
    <>
      <JsonLd data={graph} nonce={nonce} />
      <BlockScroll />
      <PageHead
        title={t(head.title)}
        accent={head.accent ? t(head.accent) : undefined}
        lead={t(head.lead)}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
      />
      <div className={styles.ways} data-layout={onHub ? "hub" : "child"}>
        {onHub ? null : (
          <WayNav
            label={t("services.nav.label")}
            items={navItems}
            variant="pages"
            current={page === "offers" ? "project" : page}
          />
        )}
        <div className={styles.sections}>{children}</div>
      </div>
    </>
  );
}
