import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";

import styles from "./admin.module.css";

interface AdminProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AdminProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.overview.meta.title") };
}

export default async function AdminOverviewPage({ params }: AdminProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.overview.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.overview.lead")}</p>
      </header>
      <EmptyState
        headingLevel={2}
        title={t("admin.overview.emptyTitle")}
        text={t("admin.overview.emptyText")}
        action={
          <Button href={`/${locale}/admin/interesados`} variant="quiet" size="sm">
            {t("admin.overview.emptyAction")}
          </Button>
        }
      />
    </>
  );
}
