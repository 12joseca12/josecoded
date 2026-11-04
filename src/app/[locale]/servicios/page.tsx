import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NeedTile } from "@/components/services/NeedTile/NeedTile";
import { PhasesTile } from "@/components/services/PhasesTile/PhasesTile";
import { ProofTile } from "@/components/services/ProofTile/ProofTile";
import { ServiceBento } from "@/components/services/ServiceBento/ServiceBento";
import { ServicePage } from "@/components/services/ServicePage/ServicePage";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Faq } from "@/components/ui/Faq/Faq";
import { Steps } from "@/components/ui/Steps/Steps";
import { isLocale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import { buildContactHref } from "@/lib/contact/ways";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildFaqItems } from "@/lib/services/faq";
import { hasProvisionalOffers, lowestOfferFrom, offers } from "@/lib/services/offers";
import { isProvisional, rates } from "@/lib/services/rates";
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

const chipKeys = {
  reactNative: "services.bento.chips.reactNative",
  react: "services.bento.chips.react",
  next: "services.bento.chips.next",
  typescript: "services.bento.chips.typescript",
  supabase: "services.bento.chips.supabase",
  cloudflare: "services.bento.chips.cloudflare",
  ai: "services.bento.chips.ai",
} as const satisfies Record<string, MessageKey>;

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
  const chips = (ids: (keyof typeof chipKeys)[]) => ids.map((id) => t(chipKeys[id]));
  const provisionalLabel = t("services.rates.provisional");

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
      <PageSection
        id="vias"
        title={t("services.bento.title")}
        lead={t("services.bento.lead")}
        size="wide"
      >
        <ServiceBento>
          <NeedTile
            way="contratacion"
            area="hiring"
            title={t("services.bento.needs.contratacion.title")}
            text={t("services.ways.contratacion.text")}
            points={[
              t("services.bento.needs.contratacion.a"),
              t("services.bento.needs.contratacion.b"),
              t("services.bento.needs.contratacion.c"),
            ]}
            figure={{
              caption: t("services.ways.contratacion.title"),
              prefix: t("services.bento.needs.contratacion.prefix"),
              value: t("services.bento.needs.contratacion.value"),
              unit: t("services.bento.needs.contratacion.unit"),
            }}
            chips={chips(["reactNative", "next", "typescript", "supabase"])}
            cta={{
              href: buildContactHref(locale, "contratacion"),
              label: t("services.ways.contratacion.cta"),
            }}
            more={{
              href: `/${locale}/sobre-mi`,
              label: t("services.ways.contratacion.more"),
            }}
          />
          <NeedTile
            way="project"
            area="project"
            title={t("services.bento.needs.project.title")}
            text={t("services.ways.project.text")}
            points={[
              t("services.bento.needs.project.a"),
              t("services.bento.needs.project.b"),
              t("services.bento.needs.project.c"),
            ]}
            figure={{
              caption: t("services.ways.project.title"),
              prefix: t("services.rates.from"),
              value: lowestOfferFrom(offers),
              unit: t("services.bento.needs.project.unit"),
              provisionalLabel: hasProvisionalOffers(offers) ? provisionalLabel : undefined,
            }}
            chips={chips(["reactNative", "next", "cloudflare"])}
            cta={{
              href: `/${locale}/servicios/a-medida`,
              label: t("services.ways.project.cta"),
            }}
          />
          <NeedTile
            way="freelance"
            area="support"
            title={t("services.bento.needs.freelance.title")}
            text={t("services.ways.freelance.text")}
            points={[
              t("services.bento.needs.freelance.a"),
              t("services.bento.needs.freelance.b"),
              t("services.bento.needs.freelance.c"),
            ]}
            figure={{
              caption: t("services.ways.freelance.title"),
              prefix: t("services.rates.from"),
              value: rates.hour,
              unit: t("services.rates.unitHour"),
              provisionalLabel: isProvisional(rates) ? provisionalLabel : undefined,
            }}
            chips={chips(["typescript", "react", "next", "ai"])}
            cta={{
              href: `/${locale}/servicios/freelance`,
              label: t("services.ways.freelance.cta"),
            }}
          />
          <PhasesTile
            title={t("services.bento.phases.title")}
            text={t("services.bento.phases.text")}
            phases={phases.map((phase) => ({ id: phase.id, label: t(phase.title) }))}
            cta={{ href: "#como-trabajo", label: t("services.bento.phases.cta") }}
          />
          <ProofTile
            title={t("services.bento.proof.title")}
            text={t("services.bento.proof.text")}
            chips={chips(["reactNative", "next", "typescript", "supabase", "cloudflare", "ai"])}
            cta={{ href: `/${locale}/proyectos`, label: t("services.bento.proof.projects") }}
            more={{ href: `/${locale}/sobre-mi#stack`, label: t("services.bento.proof.stack") }}
          />
        </ServiceBento>
      </PageSection>
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
