import { NeedTile } from "@/components/services/NeedTile/NeedTile";
import { ServiceBento } from "@/components/services/ServiceBento/ServiceBento";
import { PageSection } from "@/components/site/PageSection/PageSection";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { buildHiringLinks } from "@/lib/services/hiring-links";

interface ServicesStripProps {
  locale: Locale;
}

export async function ServicesStrip({ locale }: ServicesStripProps) {
  const t = await getTranslator(locale);
  const hiring = buildHiringLinks(t, locale);

  return (
    <PageSection
      id="vias"
      title={t("home.services.title")}
      lead={t("home.services.lead")}
      size="wide"
    >
      <ServiceBento layout="ways">
        <NeedTile
          way="contratacion"
          area="hiring"
          title={t("services.bento.needs.contratacion.title")}
          text={t("services.bento.needs.contratacion.line")}
          cta={hiring.cta}
          more={hiring.more}
        />
        <NeedTile
          way="project"
          area="project"
          title={t("services.bento.needs.project.title")}
          text={t("services.bento.needs.project.line")}
          cta={{
            href: `/${locale}/servicios/a-medida`,
            label: t("services.ways.project.cta"),
          }}
        />
        <NeedTile
          way="freelance"
          area="support"
          title={t("services.bento.needs.freelance.title")}
          text={t("services.bento.needs.freelance.line")}
          cta={{
            href: `/${locale}/servicios/freelance`,
            label: t("services.ways.freelance.cta"),
          }}
        />
      </ServiceBento>
    </PageSection>
  );
}
