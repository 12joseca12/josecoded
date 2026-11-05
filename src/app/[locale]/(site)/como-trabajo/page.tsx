import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { FaqWithNexo } from "@/components/chat/FaqWithNexo/FaqWithNexo";
import { ArchitectureDiagram } from "@/components/how/ArchitectureDiagram/ArchitectureDiagram";
import { PhaseTimeline } from "@/components/how/PhaseTimeline/PhaseTimeline";
import { PointList } from "@/components/how/PointList/PointList";
import { ProblemCard } from "@/components/how/ProblemCard/ProblemCard";
import { JsonLd } from "@/components/seo/JsonLd/JsonLd";
import { BlockScroll } from "@/components/site/BlockScroll/BlockScroll";
import { Breadcrumbs } from "@/components/site/Breadcrumbs/Breadcrumbs";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { site } from "@/config/site";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { formAnchor } from "@/lib/contact/ways";
import {
  buildDiagramLayers,
  buildHowFaq,
  buildPhases,
  buildProblems,
  buildQualityPoints,
  buildStackPoints,
} from "@/lib/how/content";
import { nonceHeader } from "@/lib/security/nonce";
import { buildBreadcrumbList, buildFaqPage, buildGraph } from "@/lib/seo/jsonld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localePath } from "@/lib/seo/routes";

import styles from "./page.module.css";

interface HowProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HowProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "/como-trabajo",
    ogImage: "how",
    title: "howPage.meta.title",
    description: "howPage.meta.description",
  });
}

export default async function HowPage({ params }: HowProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, requestHeaders] = await Promise.all([getTranslator(locale), headers()]);
  const nonce = requestHeaders.get(nonceHeader) ?? undefined;
  const faq = buildHowFaq(t);

  const crumbs = [
    { label: t("nav.home"), href: localePath(locale, "") },
    { label: t("howPage.crumb"), href: localePath(locale, "/como-trabajo") },
  ];
  const graph = buildGraph(
    buildBreadcrumbList(
      site.origin,
      crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })),
    ),
    buildFaqPage(faq),
  );

  return (
    <>
      <JsonLd data={graph} nonce={nonce} />
      <BlockScroll />
      <PageHead
        title={t("howPage.head.title")}
        accent={t("howPage.head.accent")}
        lead={t("howPage.head.lead")}
        breadcrumbs={<Breadcrumbs label={t("breadcrumbs.label")} items={crumbs} />}
      />
      <div className={styles.sections}>
        <PageSection
          id="fases"
          title={t("howPage.phases.title")}
          lead={t("howPage.phases.lead")}
          size="wide"
        >
          <PhaseTimeline
            phases={buildPhases(t)}
            labels={{
              list: t("howPage.phases.list"),
              getsLabel: t("howPage.phases.getsLabel"),
              needsLabel: t("howPage.phases.needsLabel"),
            }}
          />
        </PageSection>
        <PageSection
          id="problemas"
          title={t("howPage.problems.title")}
          lead={t("howPage.problems.lead")}
          size="wide"
        >
          <div className={styles.cards}>
            {buildProblems(t).map((item) => (
              <ProblemCard
                key={item.id}
                item={item}
                labels={{
                  problem: t("howPage.problems.problem"),
                  decision: t("howPage.problems.decision"),
                  result: t("howPage.problems.result"),
                }}
              />
            ))}
          </div>
        </PageSection>
        <PageSection
          id="tecnica"
          title={t("howPage.tech.title")}
          lead={t("howPage.tech.lead")}
          size="wide"
        >
          <ArchitectureDiagram
            layers={buildDiagramLayers(t)}
            label={t("howPage.tech.diagram.label")}
            caption={t("howPage.tech.diagram.caption")}
            description={t("howPage.tech.diagram.description")}
          />
          <PointList items={buildStackPoints(t)} />
        </PageSection>
        <PageSection
          id="calidad"
          title={t("howPage.quality.title")}
          lead={t("howPage.quality.lead")}
          size="wide"
        >
          <PointList items={buildQualityPoints(t)} />
        </PageSection>
        <PageSection id="preguntas" title={t("howPage.faq.title")} size="wide">
          <FaqWithNexo locale={locale} items={faq} />
        </PageSection>
        <PageSection id="contacto" title={t("howPage.cta.title")} lead={t("howPage.cta.lead")}>
          <div className={styles.actions}>
            <Button href={`/${locale}/contacto${formAnchor}`} icon={<ArrowIcon />}>
              {t("howPage.cta.contact")}
            </Button>
            <Button href={`/${locale}/servicios/a-medida`} variant="ghost" icon={<ArrowIcon />}>
              {t("howPage.cta.offers")}
            </Button>
            <Button href={`/${locale}/servicios`} variant="ghost" icon={<ArrowIcon />}>
              {t("howPage.cta.services")}
            </Button>
          </div>
        </PageSection>
      </div>
    </>
  );
}
