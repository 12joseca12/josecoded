import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PackCompare } from "@/components/services/PackCompare/PackCompare";
import { ServicePage } from "@/components/services/ServicePage/ServicePage";
import { PageSection } from "@/components/site/PageSection/PageSection";
import { Button } from "@/components/ui/Button/Button";
import { Faq } from "@/components/ui/Faq/Faq";
import { ArrowIcon } from "@/components/ui/icons/ArrowIcon";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { buildContactHref } from "@/lib/contact/ways";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildFaqItems } from "@/lib/services/faq";
import { hasProvisionalPacks, isPackProvisional, packCopyKeys, packs } from "@/lib/services/packs";
import type { PackCardItem } from "@/types/services";

import styles from "./page.module.css";

interface PacksProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PacksProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata({
    locale,
    path: "/servicios/packs",
    title: "packsPage.meta.title",
    description: "packsPage.meta.description",
  });
}

export default async function PacksPage({ params }: PacksProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  const faq = buildFaqItems(t, "packs");
  const items: PackCardItem[] = packs.map((pack) => {
    const copy = packCopyKeys[pack.slug];
    const name = t(copy.name);
    return {
      slug: pack.slug,
      name,
      text: t(copy.text),
      bullets: copy.bullets.map((key) => t(key)),
      price: pack.from,
      provisional: isPackProvisional(pack),
      ctaHref: buildContactHref(locale, "packs", pack.slug),
      ctaLabel: t("packsPage.compare.ctaFor").replace("{name}", name),
    };
  });

  return (
    <ServicePage
      locale={locale}
      page="packs"
      head={{
        title: "packsPage.head.title",
        accent: "packsPage.head.accent",
        lead: "packsPage.head.lead",
      }}
      faq={faq}
    >
      <PageSection
        id="comparador"
        title={t("packsPage.compare.title")}
        lead={t("packsPage.compare.lead")}
        size="wide"
      >
        <PackCompare
          labels={{
            from: t("packsPage.compare.from"),
            unit: t("packsPage.compare.unit"),
            price: t("packsPage.compare.price"),
            includes: t("packsPage.compare.includes"),
            provisional: t("services.rates.provisional"),
          }}
          items={items}
        />
        {hasProvisionalPacks(packs) ? (
          <p className={styles.note}>{t("services.rates.provisionalNote")}</p>
        ) : null}
      </PageSection>
      <PageSection id="preguntas" title={t("services.faq.title")}>
        <Faq items={faq} />
      </PageSection>
      <PageSection
        id="contacto"
        title={t("packsPage.closing.title")}
        lead={t("packsPage.closing.text")}
      >
        <div className={styles.actions}>
          <Button href={buildContactHref(locale, "packs")} icon={<ArrowIcon />}>
            {t("packsPage.closing.cta")}
          </Button>
          <Button href={`/${locale}/servicios#como-trabajo`} variant="ghost" icon={<ArrowIcon />}>
            {t("packsPage.closing.more")}
          </Button>
        </div>
      </PageSection>
    </ServicePage>
  );
}
