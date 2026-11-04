import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ServicePage } from "@/components/services/ServicePage/ServicePage";
import { WaySection } from "@/components/services/WaySection/WaySection";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Button } from "@/components/ui/Button/Button";
import { Faq } from "@/components/ui/Faq/Faq";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { Steps } from "@/components/ui/Steps/Steps";
import { isLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { buildContactHref } from "@/lib/contact/ways";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildFaqItems } from "@/lib/services/faq";
import type { StepItem } from "@/types/services";

interface ServicesProps {
  params: Promise<{ locale: string }>;
}

const phases: { id: string; title: MessageKey; text: MessageKey }[] = [
  { id: "discover", title: "home.hero.phases.discover", text: "services.how.phases.discover" },
  { id: "design", title: "home.hero.phases.design", text: "services.how.phases.design" },
  { id: "build", title: "home.hero.phases.build", text: "services.how.phases.build" },
  { id: "publish", title: "home.hero.phases.publish", text: "services.how.phases.publish" },
  { id: "maintain", title: "home.hero.phases.maintain", text: "services.how.phases.maintain" },
];

export async function generateMetadata({ params }: ServicesProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "/servicios",
    title: "services.meta.title",
    description: "services.meta.description",
  });
}

export default async function ServicesPage({ params }: ServicesProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const faq = buildFaqItems(t, "hub");
  const steps: StepItem[] = phases.map((phase) => ({
    id: phase.id,
    title: t(phase.title),
    text: t(phase.text),
  }));

  return (
    <ServicePage
      locale={locale}
      page="hub"
      head={{
        title: "services.head.title",
        accent: "services.head.accent",
        lead: "services.head.lead",
      }}
      faq={faq}
    >
      <WaySection
        id="contratacion"
        title={t("services.ways.contratacion.title")}
        text={t("services.ways.contratacion.text")}
        actions={
          <>
            <Button href={buildContactHref(locale, "contratacion")} icon={<ArrowIcon />}>
              {t("services.ways.contratacion.cta")}
            </Button>
            <Button href={`/${locale}/sobre-mi`} variant="ghost" icon={<ArrowIcon />}>
              {t("services.ways.contratacion.more")}
            </Button>
          </>
        }
      />
      <WaySection
        id="freelance"
        title={t("services.ways.freelance.title")}
        text={t("services.ways.freelance.text")}
        actions={
          <Button href={`/${locale}/servicios/freelance`} icon={<ArrowIcon />}>
            {t("services.ways.freelance.cta")}
          </Button>
        }
      />
      <WaySection
        id="packs"
        title={t("services.ways.packs.title")}
        text={t("services.ways.packs.text")}
        actions={
          <Button href={`/${locale}/servicios/packs`} icon={<ArrowIcon />}>
            {t("services.ways.packs.cta")}
          </Button>
        }
      />
      <PageSection
        id="como-trabajo"
        title={t("services.how.title")}
        lead={t("services.how.lead")}
        size="wide"
      >
        <Steps items={steps} />
      </PageSection>
      <PageSection id="preguntas" title={t("services.faq.title")}>
        <Faq items={faq} />
      </PageSection>
    </ServicePage>
  );
}
