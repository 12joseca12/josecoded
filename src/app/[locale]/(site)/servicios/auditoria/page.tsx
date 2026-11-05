import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FaqWithNexo } from "@/components/chat/FaqWithNexo/FaqWithNexo";
import { ServicePage } from "@/components/services/ServicePage/ServicePage";
import { TermsStrip } from "@/components/services/TermsStrip/TermsStrip";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { PriceState } from "@/components/ui/PriceState/PriceState";
import { Steps } from "@/components/ui/Steps/Steps";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildAuditHref } from "@/lib/services/audit";
import { buildFaqItems } from "@/lib/services/faq";
import type { StepItem, TermItem } from "@/types/services";

import styles from "./page.module.css";

interface AuditProps {
  params: Promise<{ locale: string }>;
}

const reviewAreas = ["performance", "a11y", "seo", "security", "analytics", "automation"] as const;

const deliverables = ["report", "session", "scope"] as const;

const stepIds = ["tell", "agree", "review", "explain"] as const;

export async function generateMetadata({ params }: AuditProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "/servicios/auditoria",
    title: "auditPage.meta.title",
    description: "auditPage.meta.description",
  });
}

export default async function AuditPage({ params }: AuditProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const faq = buildFaqItems(t, "audit");
  const reviewItems: TermItem[] = reviewAreas.map((id) => ({
    id,
    title: t(`auditPage.review.${id}.title`),
    text: t(`auditPage.review.${id}.text`),
  }));
  const deliverItems: TermItem[] = deliverables.map((id) => ({
    id,
    title: t(`auditPage.deliver.${id}.title`),
    text: t(`auditPage.deliver.${id}.text`),
  }));
  const steps: StepItem[] = stepIds.map((id) => ({
    id,
    title: t(`auditPage.steps.${id}.title`),
    text: t(`auditPage.steps.${id}.text`),
  }));

  return (
    <ServicePage
      locale={locale}
      page="audit"
      head={{
        title: "auditPage.head.title",
        accent: "auditPage.head.accent",
        lead: "auditPage.head.lead",
      }}
      faq={faq}
      service={{
        name: "auditPage.schema.name",
        description: "auditPage.meta.description",
        type: "auditPage.schema.type",
      }}
    >
      <PageSection
        id="revision"
        title={t("auditPage.review.title")}
        lead={t("auditPage.review.lead")}
        size="wide"
      >
        <TermsStrip labelledBy="revision-title" items={reviewItems} />
      </PageSection>
      <PageSection
        id="entrego"
        title={t("auditPage.deliver.title")}
        lead={t("auditPage.deliver.lead")}
        size="wide"
      >
        <TermsStrip labelledBy="entrego-title" items={deliverItems} />
      </PageSection>
      <PageSection id="precio" title={t("auditPage.price.title")}>
        <div className={styles.price}>
          <PriceState
            variant="review"
            label={t("services.price.review")}
            note={t("services.price.reviewNote")}
          />
          <p>{t("auditPage.price.text")}</p>
        </div>
      </PageSection>
      <PageSection id="pasos" title={t("auditPage.steps.title")} size="wide">
        <Steps items={steps} />
      </PageSection>
      <PageSection id="preguntas" title={t("services.faq.title")} size="wide">
        <FaqWithNexo locale={locale} items={faq} />
      </PageSection>
      <PageSection
        id="contacto"
        title={t("auditPage.closing.title")}
        lead={t("auditPage.closing.text")}
      >
        <div className={styles.actions}>
          <Button href={buildAuditHref(locale)} icon={<ArrowIcon />}>
            {t("auditPage.closing.cta")}
          </Button>
          <Button href={`/${locale}/como-trabajo`} variant="ghost" icon={<ArrowIcon />}>
            {t("auditPage.closing.more")}
          </Button>
        </div>
      </PageSection>
    </ServicePage>
  );
}
