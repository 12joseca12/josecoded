import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { LeadTable } from "@/components/admin/LeadTable/LeadTable";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchLeads } from "@/lib/admin/leads";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadTableLabels } from "@/types/leads";

import styles from "../admin.module.css";

interface LeadsProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LeadsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.leads.meta.title") };
}

async function LeadsSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchLeads(client);

  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.leads.error.title")}
        text={t("admin.leads.error.text")}
        retryLabel={t("admin.leads.error.retry")}
        loadingLabel={t("admin.leads.error.retrying")}
      />
    );
  }
  if (result.rows.length === 0) {
    return (
      <EmptyState
        headingLevel={2}
        title={t("admin.leads.empty.title")}
        text={t("admin.leads.empty.text")}
      />
    );
  }

  const labels: LeadTableLabels = {
    region: t("admin.leads.region"),
    caption: t("admin.leads.caption"),
    columns: {
      via: t("admin.leads.columns.via"),
      name: t("admin.leads.columns.name"),
      email: t("admin.leads.columns.email"),
      status: t("admin.leads.columns.status"),
      date: t("admin.leads.columns.date"),
    },
    via: {
      hiring: t("admin.leads.via.hiring"),
      freelance: t("admin.leads.via.freelance"),
      pack: t("admin.leads.via.pack"),
      none: t("admin.leads.via.none"),
    },
    status: {
      new: t("admin.leads.status.new"),
      assigned: t("admin.leads.status.assigned"),
      contacted: t("admin.leads.status.contacted"),
      converted: t("admin.leads.status.converted"),
      discarded: t("admin.leads.status.discarded"),
    },
    noEmail: t("admin.leads.noEmail"),
  };
  return (
    <>
      <LeadTable rows={result.rows} locale={locale} labels={labels} />
      {result.rows.length >= result.limit ? (
        <p className={styles.note}>
          {t("admin.leads.limit").replace("{count}", String(result.limit))}
        </p>
      ) : null}
    </>
  );
}

export default async function LeadsPage({ params }: LeadsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.leads.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.leads.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("admin.leads.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <LeadsSection locale={locale} />
      </Suspense>
    </>
  );
}
