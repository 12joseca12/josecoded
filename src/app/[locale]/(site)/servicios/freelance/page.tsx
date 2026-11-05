import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FaqWithNexo } from "@/components/chat/FaqWithNexo/FaqWithNexo";
import { AvailabilityNote } from "@/components/services/AvailabilityNote/AvailabilityNote";
import { PilotTask } from "@/components/services/PilotTask/PilotTask";
import { RateFigure } from "@/components/services/RateFigure/RateFigure";
import { ServicePage } from "@/components/services/ServicePage/ServicePage";
import { TaskExamples } from "@/components/services/TaskExamples/TaskExamples";
import { TermsStrip } from "@/components/services/TermsStrip/TermsStrip";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { Steps } from "@/components/ui/Steps/Steps";
import { isLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { getCatalog } from "@/lib/catalog/load";
import { buildContactHref } from "@/lib/contact/ways";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { freshAvailability, loadAvailability } from "@/lib/services/availability";
import { buildFaqItems } from "@/lib/services/faq";
import { buildPilotHref } from "@/lib/services/pilot";
import { isProvisional } from "@/lib/services/rates";
import type { StepItem, TaskExampleItem, TermItem } from "@/types/services";

import styles from "./page.module.css";

interface FreelanceProps {
  params: Promise<{ locale: string }>;
}

const tasks = ["feature", "audit", "a11y", "rescue", "ai"] as const;

const terms = ["repo", "invoice", "ownership", "delivery"] as const;

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
    ogImage: "freelance",
    title: "freelancePage.meta.title",
    description: "freelancePage.meta.description",
  });
}

export default async function FreelancePage({ params }: FreelanceProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [t, { rates }] = await Promise.all([getTranslator(locale), getCatalog()]);
  const provisional = isProvisional(rates);
  const faq = buildFaqItems(t, "freelance");
  const availability = freshAvailability(await loadAvailability(), new Date());
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const availabilityLines = availability
    ? [
        availability.weeklyHours
          ? `${availability.weeklyHours} ${t("freelancePage.availability.hours")}`
          : null,
        availability.from ? `${t("freelancePage.availability.from")} ${availability.from}` : null,
      ].filter((line): line is string => line !== null)
    : [];
  const availabilityUpdated = availability
    ? `${t("freelancePage.availability.updated")} ${format.format(new Date(availability.updatedAt))}`
    : "";
  const taskItems: TaskExampleItem[] = tasks.map((id) => ({
    id,
    title: t(`freelancePage.scope.${id}.title`),
    text: t(`freelancePage.scope.${id}.text`),
    size: t(`freelancePage.scope.${id}.size`),
    deliverable: t(`freelancePage.scope.${id}.deliverable`),
  }));
  const termItems: TermItem[] = terms.map((id) => ({
    id,
    title: t(`freelancePage.terms.${id}.title`),
    text: t(`freelancePage.terms.${id}.text`),
  }));
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
        <AvailabilityNote
          label={t("freelancePage.availability.label")}
          lines={availabilityLines}
          updated={availabilityUpdated}
        />
      </PageSection>
      <PageSection
        id="incluye"
        title={t("freelancePage.scope.title")}
        lead={t("freelancePage.scope.lead")}
      >
        <TaskExamples
          items={taskItems}
          sizeLabel={t("freelancePage.scope.sizeLabel")}
          deliverableLabel={t("freelancePage.scope.deliverableLabel")}
          note={t("freelancePage.scope.note")}
        />
      </PageSection>
      <PageSection id="condiciones" title={t("freelancePage.terms.title")}>
        <TermsStrip labelledBy="condiciones-title" items={termItems} />
      </PageSection>
      <PageSection id="tarea-piloto" title={t("freelancePage.pilot.title")}>
        <PilotTask
          text={t("freelancePage.pilot.text")}
          cta={t("freelancePage.pilot.cta")}
          href={buildPilotHref(locale)}
        />
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
