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
import { assignLead, discardLead } from "./actions";

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
      assigned: t("admin.leads.columns.assigned"),
      date: t("admin.leads.columns.date"),
      actions: t("admin.leads.columns.actions"),
    },
    via: {
      hiring: t("admin.leads.via.hiring"),
      freelance: t("admin.leads.via.freelance"),
      project: t("admin.leads.via.project"),
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
    unassigned: t("admin.leads.unassigned"),
    unknownAssignee: t("admin.leads.unknownAssignee"),
    actions: {
      assignLabel: t("admin.leads.actions.assignLabel"),
      assignPlaceholder: t("admin.leads.actions.assignPlaceholder"),
      assign: t("admin.leads.actions.assign"),
      assigning: t("admin.leads.actions.assigning"),
      noAssignees: t("admin.leads.actions.noAssignees"),
      discardOpen: t("admin.leads.actions.discardOpen"),
      discardReasonLabel: t("admin.leads.actions.discardReasonLabel"),
      discardSubmit: t("admin.leads.actions.discardSubmit"),
      discarding: t("admin.leads.actions.discarding"),
      reasonPrefix: t("admin.leads.actions.reasonPrefix"),
      done: {
        assign: t("admin.leads.actions.done.assign"),
        discard: t("admin.leads.actions.done.discard"),
      },
      errors: {
        assignee: t("admin.leads.actions.errors.assignee"),
        reason: t("admin.leads.actions.errors.reason"),
        stale: t("admin.leads.actions.errors.stale"),
        forbidden: t("admin.leads.actions.errors.forbidden"),
        error: t("admin.leads.actions.errors.error"),
      },
    },
  };
  return (
    <>
      <LeadTable
        rows={result.rows}
        assignees={result.assignees}
        locale={locale}
        labels={labels}
        assign={assignLead.bind(null, locale)}
        discard={discardLead.bind(null, locale)}
      />
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
