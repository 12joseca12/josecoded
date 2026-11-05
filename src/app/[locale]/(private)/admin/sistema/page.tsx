import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { JobTable } from "@/components/admin/JobTable/JobTable";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { OmenStatus } from "@/components/admin/OmenStatus/OmenStatus";
import { SwitchList } from "@/components/admin/SwitchList/SwitchList";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import {
  fetchJobs,
  fetchOmenStatus,
  fetchSettings,
  parseJobFilter,
  summarizeOmen,
} from "@/lib/admin/system";
import {
  buildJobTableLabels,
  buildOmenLabels,
  buildSwitchListLabels,
} from "@/lib/admin/system-labels";
import { requireZone } from "@/lib/auth/session";
import { buildSettingViews } from "@/lib/settings/definitions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { jobsLimit, type JobStatus } from "@/types/system";

import styles from "../admin.module.css";
import { cancelJob, retryJob, saveSetting } from "./actions";
import local from "./sistema.module.css";

interface SystemProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: SystemProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.system.meta.title") };
}

function Loading({ label }: { label: string }) {
  return (
    <LoadingRegion
      loading
      label={label}
      fallback={
        <div className={styles.skeleton}>
          <Skeleton height="4rem" />
          <Skeleton height="4rem" />
          <Skeleton height="4rem" />
        </div>
      }
    >
      {null}
    </LoadingRegion>
  );
}

async function OmenSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchOmenStatus(client);
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.system.omen.error.title")}
        text={t("admin.system.omen.error.text")}
        retryLabel={t("admin.system.omen.error.retry")}
        loadingLabel={t("admin.system.omen.error.retrying")}
      />
    );
  }
  const data = result.status === "ok" ? result.data : null;
  return (
    <OmenStatus
      summary={summarizeOmen(data, new Date())}
      data={data}
      unavailable={result.status === "unavailable"}
      labels={buildOmenLabels(t)}
      locale={locale}
    />
  );
}

async function SettingsSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchSettings(client);
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.system.settings.error.title")}
        text={t("admin.system.settings.error.text")}
        retryLabel={t("admin.system.settings.error.retry")}
        loadingLabel={t("admin.system.settings.error.retrying")}
      />
    );
  }
  const available = result.status === "ok";
  return (
    <>
      {available ? null : (
        <div className={local.notice}>
          <Heading level={2} size="h4">
            {t("admin.system.settings.unavailable.title")}
          </Heading>
          <p>{t("admin.system.settings.unavailable.text")}</p>
        </div>
      )}
      <SwitchList
        settings={buildSettingViews(available ? result.data : null)}
        labels={buildSwitchListLabels(t)}
        locale={locale}
        save={saveSetting.bind(null, locale)}
        readOnly={!available}
      />
    </>
  );
}

async function JobsSection({ locale, filter }: { locale: Locale; filter: JobStatus | null }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchJobs(client, filter);
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.system.jobs.error.title")}
        text={t("admin.system.jobs.error.text")}
        retryLabel={t("admin.system.jobs.error.retry")}
        loadingLabel={t("admin.system.jobs.error.retrying")}
      />
    );
  }
  if (result.status === "unavailable") {
    return (
      <EmptyState
        headingLevel={3}
        title={t("admin.system.jobs.unavailable.title")}
        text={t("admin.system.jobs.unavailable.text")}
      />
    );
  }
  const rows = result.data;
  return (
    <>
      <JobTable
        rows={rows}
        filter={filter}
        basePath={`/${locale}/admin/sistema`}
        locale={locale}
        labels={buildJobTableLabels(t)}
        retry={retryJob.bind(null, locale)}
        cancel={cancelJob.bind(null, locale)}
      />
      {rows.length === 0 ? (
        <EmptyState
          headingLevel={3}
          title={t(
            filter ? "admin.system.jobs.emptyFiltered.title" : "admin.system.jobs.empty.title",
          )}
          text={t(filter ? "admin.system.jobs.emptyFiltered.text" : "admin.system.jobs.empty.text")}
        />
      ) : null}
      {rows.length >= jobsLimit ? (
        <p className={styles.note}>
          {t("admin.system.jobs.limit").replace("{count}", String(jobsLimit))}
        </p>
      ) : null}
    </>
  );
}

export default async function SystemPage({ params, searchParams }: SystemProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  const filter = parseJobFilter(query.estado);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.system.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.system.lead")}</p>
      </header>
      <div className={local.stack}>
        <Suspense fallback={<Loading label={t("admin.system.loading.omen")} />}>
          <OmenSection locale={locale} />
        </Suspense>
        <Suspense fallback={<Loading label={t("admin.system.loading.settings")} />}>
          <SettingsSection locale={locale} />
        </Suspense>
        <section className={local.jobs} aria-labelledby="jobs-title">
          <header className={styles.head}>
            <Heading level={2} size="h3" id="jobs-title">
              {t("admin.system.jobs.title")}
            </Heading>
            <p className={styles.lead}>{t("admin.system.jobs.lead")}</p>
          </header>
          <Suspense fallback={<Loading label={t("admin.system.loading.jobs")} />}>
            <JobsSection locale={locale} filter={filter} />
          </Suspense>
        </section>
      </div>
    </>
  );
}
