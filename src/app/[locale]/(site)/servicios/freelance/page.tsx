import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FaqWithNexo } from "@/components/chat/FaqWithNexo/FaqWithNexo";
import { RateFigure } from "@/components/services/RateFigure/RateFigure";
import { ServicePage } from "@/components/services/ServicePage/ServicePage";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Button } from "@/components/ui/Button/Button";
import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { Steps } from "@/components/ui/Steps/Steps";
import { isLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { buildContactHref } from "@/lib/contact/ways";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildFaqItems } from "@/lib/services/faq";
import { isProvisional, rates } from "@/lib/services/rates";
import type { StepItem } from "@/types/services";

import styles from "./page.module.css";

interface FreelanceProps {
  params: Promise<{ locale: string }>;
}

const scope: { id: string; title: MessageKey; text: MessageKey }[] = [
  {
    id: "feature",
    title: "freelancePage.scope.feature.title",
    text: "freelancePage.scope.feature.text",
  },
  {
    id: "audit",
    title: "freelancePage.scope.audit.title",
    text: "freelancePage.scope.audit.text",
  },
  {
    id: "rescue",
    title: "freelancePage.scope.rescue.title",
    text: "freelancePage.scope.rescue.text",
  },
  { id: "ai", title: "freelancePage.scope.ai.title", text: "freelancePage.scope.ai.text" },
];

const start: { id: string; title: MessageKey; text: MessageKey }[] = [
  {
    id: "tell",
    title: "freelancePage.start.tell.title",
    text: "freelancePage.start.tell.text",
  },
  {
    id: "agree",
    title: "freelancePage.start.agree.title",
    text: "freelancePage.start.agree.text",
  },
  {
    id: "build",
    title: "freelancePage.start.build.title",
    text: "freelancePage.start.build.text",
  },
];

export async function generateMetadata({ params }: FreelanceProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "/servicios/freelance",
    title: "freelancePage.meta.title",
    description: "freelancePage.meta.description",
  });
}

export default async function FreelancePage({ params }: FreelanceProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const provisional = isProvisional(rates);
  const faq = buildFaqItems(t, "freelance");
  const steps: StepItem[] = start.map((step) => ({
    id: step.id,
    title: t(step.title),
    text: t(step.text),
  }));

  return (
    <ServicePage
      locale={locale}
      page="freelance"
      head={{
        title: "freelancePage.head.title",
        accent: "freelancePage.head.accent",
        lead: "freelancePage.head.lead",
      }}
      faq={faq}
    >
      <PageSection id="tarifas" title={t("freelancePage.rates.title")}>
        <RateFigure
          label={t("services.rates.label")}
          note={t(provisional ? "services.price.reviewNote" : "services.rates.note")}
          review={provisional ? t("services.price.review") : undefined}
          items={[
            {
              id: "hour",
              label: t("services.rates.hour"),
              value: rates.hour,
              unit: t("services.rates.unitHour"),
            },
            {
              id: "task",
              label: t("services.rates.task"),
              value: rates.task,
              prefix: t("services.rates.from"),
              unit: t("services.rates.unitTask"),
            },
          ]}
        />
      </PageSection>
      <PageSection id="incluye" title={t("freelancePage.scope.title")}>
        <ul className={styles.scope}>
          {scope.map((item) => (
            <li key={item.id}>
              <Card as="article" size="sm" className={styles.card}>
                <Heading level={3} size="h4">
                  {t(item.title)}
                </Heading>
                <p className={styles.text}>{t(item.text)}</p>
              </Card>
            </li>
          ))}
        </ul>
      </PageSection>
      <PageSection id="como-empezamos" title={t("freelancePage.start.title")} size="wide">
        <Steps items={steps} />
      </PageSection>
      <PageSection id="preguntas" title={t("services.faq.title")} size="wide">
        <FaqWithNexo locale={locale} items={faq} />
      </PageSection>
      <PageSection
        id="contacto"
        title={t("freelancePage.closing.title")}
        lead={t("freelancePage.closing.text")}
      >
        <div className={styles.actions}>
          <Button href={buildContactHref(locale, "freelance")} icon={<ArrowIcon />}>
            {t("freelancePage.closing.cta")}
          </Button>
          <Button href={`/${locale}/como-trabajo`} variant="ghost" icon={<ArrowIcon />}>
            {t("freelancePage.closing.more")}
          </Button>
        </div>
      </PageSection>
    </ServicePage>
  );
}
