import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";

import styles from "./crm.module.css";

interface CrmProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CrmProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("crm.overview.meta.title") };
}

export default async function CrmOverviewPage({ params }: CrmProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("crm", locale);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("crm.overview.title")}
        </Heading>
        <p className={styles.lead}>{t("crm.overview.lead")}</p>
      </header>
      <EmptyState
        headingLevel={2}
        title={t("crm.overview.emptyTitle")}
        text={t("crm.overview.emptyText")}
      />
    </>
  );
}
