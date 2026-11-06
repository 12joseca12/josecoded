import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ImportHistory } from "@/components/crm/ImportHistory/ImportHistory";
import { ImportWorkbench } from "@/components/crm/ImportWorkbench/ImportWorkbench";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { fetchImportHistory, fetchImportOwners } from "@/lib/crm/import-history";
import { importHistoryLabels, importLabels } from "@/lib/crm/import-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";

import styles from "../crm.module.css";
import { commitImportAction, previewImportAction } from "./actions";

interface ImportPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ImportPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("crm.import.meta.title") };
}

interface SectionProps {
  locale: Locale;
  userId: string;
  role: UserRole;
}

async function WorkbenchSection({ locale, userId, role }: SectionProps) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const owners = role === "admin" ? await fetchImportOwners(client) : null;
  return (
    <ImportWorkbench
      labels={importLabels(t)}
      preview={previewImportAction.bind(null, locale)}
      commit={commitImportAction.bind(null, locale)}
      owners={owners}
      selfId={userId}
      contactsHref={`/${locale}/crm/contactos`}
    />
  );
}

async function HistorySection({ locale, userId }: Pick<SectionProps, "locale" | "userId">) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const rows = await fetchImportHistory(client, userId);
  if (rows === null) return <p className={styles.note}>{t("crm.import.history.error")}</p>;
  return <ImportHistory rows={rows} locale={locale} labels={importHistoryLabels(t)} />;
}

export default async function ImportPage({ params }: ImportPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("crm", locale);
  const t = await getTranslator(locale);
  const loading = (
    <LoadingRegion
      loading
      label={t("crm.import.loading")}
      fallback={
        <div className={styles.skeleton}>
          <Skeleton height="6rem" />
          <Skeleton height="3rem" />
        </div>
      }
    >
      {null}
    </LoadingRegion>
  );
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("crm.import.title")}
        </Heading>
        <p className={styles.lead}>{t("crm.import.lead")}</p>
      </header>
      <Suspense fallback={loading}>
        <WorkbenchSection locale={locale} userId={member.userId} role={member.role} />
      </Suspense>
      <Suspense fallback={loading}>
        <HistorySection locale={locale} userId={member.userId} />
      </Suspense>
    </>
  );
}
