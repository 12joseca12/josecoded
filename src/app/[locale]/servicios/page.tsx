import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RateFigure } from "@/components/services/RateFigure/RateFigure";
import { WayNav } from "@/components/services/WayNav/WayNav";
import { WaySection } from "@/components/services/WaySection/WaySection";
import { BlockScroll } from "@/components/site/BlockScroll/BlockScroll";
import { PageHead } from "@/components/site/PageHead/PageHead";
import { Button } from "@/components/ui/Button/Button";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { rateFixture } from "@/lib/services/rates";
import type { WayNavItem } from "@/types/services";

import styles from "./page.module.css";

interface ServicesProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ServicesProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("services.meta.title") };
}

export default async function ServicesPage({ params }: ServicesProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const contact = `/${locale}/contacto`;

  const navItems: WayNavItem[] = [
    { id: "contratacion", label: t("services.ways.contratacion.nav") },
    { id: "freelance", label: t("services.ways.freelance.nav") },
    { id: "packs", label: t("services.ways.packs.nav") },
  ];

  return (
    <main>
      <BlockScroll />
      <PageHead
        title={t("services.head.title")}
        accent={t("services.head.accent")}
        lead={t("services.head.lead")}
      />
      <div className={styles.ways}>
        <WayNav label={t("services.nav.label")} items={navItems} />
        <div className={styles.sections}>
          <WaySection
            id="contratacion"
            title={t("services.ways.contratacion.title")}
            text={t("services.ways.contratacion.text")}
            audienceLabel={t("services.audience")}
            audience={t("services.ways.contratacion.audience")}
            bullets={[
              t("services.ways.contratacion.bullets.a"),
              t("services.ways.contratacion.bullets.b"),
              t("services.ways.contratacion.bullets.c"),
            ]}
            actions={
              <>
                <Button href="/cv.pdf" download icon={<ArrowIcon />}>
                  {t("services.ways.contratacion.cv")}
                </Button>
                <Button href={`/${locale}/chat`} variant="ghost" icon={<ArrowIcon />}>
                  {t("services.ways.contratacion.chat")}
                </Button>
              </>
            }
          />
          <WaySection
            id="freelance"
            title={t("services.ways.freelance.title")}
            text={t("services.ways.freelance.text")}
            audienceLabel={t("services.audience")}
            audience={t("services.ways.freelance.audience")}
            bullets={[
              t("services.ways.freelance.bullets.a"),
              t("services.ways.freelance.bullets.b"),
              t("services.ways.freelance.bullets.c"),
            ]}
            extra={
              <RateFigure
                label={t("services.rates.label")}
                note={t("services.rates.note")}
                items={[
                  {
                    id: "hour",
                    label: t("services.rates.hour"),
                    value: rateFixture.hour,
                    unit: t("services.rates.unitHour"),
                  },
                  {
                    id: "task",
                    label: t("services.rates.task"),
                    value: rateFixture.task,
                    unit: t("services.rates.unitTask"),
                  },
                ]}
              />
            }
            actions={
              <Button href={`${contact}?via=freelance`} icon={<ArrowIcon />}>
                {t("services.ways.freelance.cta")}
              </Button>
            }
          />
          <WaySection
            id="packs"
            title={t("services.ways.packs.title")}
            text={t("services.ways.packs.text")}
            audienceLabel={t("services.audience")}
            audience={t("services.ways.packs.audience")}
            bullets={[
              t("services.ways.packs.bullets.a"),
              t("services.ways.packs.bullets.b"),
              t("services.ways.packs.bullets.c"),
            ]}
            actions={
              <>
                <Button href={`${contact}?via=packs`} icon={<ArrowIcon />}>
                  {t("services.ways.packs.cta")}
                </Button>
                <Button href="#comparador" variant="ghost" icon={<ArrowIcon />}>
                  {t("services.ways.packs.view")}
                </Button>
              </>
            }
          />
        </div>
      </div>
    </main>
  );
}
