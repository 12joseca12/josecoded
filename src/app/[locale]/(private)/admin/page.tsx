import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AuditList } from "@/components/admin/AuditList/AuditList";
import { CounterCell } from "@/components/admin/CounterCell/CounterCell";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { OmenStatus } from "@/components/admin/OmenStatus/OmenStatus";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchAudit, summarizeEntry } from "@/lib/admin/audit";
import { buildAuditListLabels, buildCounterLabels } from "@/lib/admin/audit-labels";
import { buildCells, fetchCounters } from "@/lib/admin/overview";
import { fetchOmenStatus, summarizeOmen } from "@/lib/admin/system";
import { buildOmenLabels } from "@/lib/admin/system-labels";
import { requireZone } from "@/lib/auth/session";
import { staffNav } from "@/lib/staff/nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "./admin.module.css";
import local from "./overview.module.css";

interface AdminProps {
  params: Promise<{ locale: string }>;
}

const recentLimit = 10;

export async function generateMetadata({ params }: AdminProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.overview.meta.title") };
}

function Loading({ label }: { label: string }) {
  return (
    <LoadingRegion
      loading
      label={label}
      fallback={
        <div className={styles.skeleton}>
          <Skeleton height="6rem" />
          <Skeleton height="6rem" />
        </div>
      }
    >
      {null}
    </LoadingRegion>
  );
}

const readyNav = (["admin", "crm"] as const).flatMap((zone) =>
  staffNav[zone]
    .filter((entry) => entry.ready)
    .map((entry) => ({ zone, key: entry.key, path: entry.path })),
);

async function CountersSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchCounters(client);
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.overview.cells.error.title")}
        text={t("admin.overview.cells.error.text")}
        retryLabel={t("admin.overview.cells.error.retry")}
        loadingLabel={t("admin.overview.cells.error.retrying")}
      />
    );
  }
  const cells = buildCells(
    result.status === "ok" ? result.data : null,
    buildCounterLabels(t),
    locale,
    readyNav,
  );
  return (
    <>
      {result.status === "unavailable" ? (
        <div className={local.notice} role="status">
          <Heading level={3} size="h4">
            {t("admin.overview.cells.unavailable.title")}
          </Heading>
          <p>{t("admin.overview.cells.unavailable.text")}</p>
        </div>
      ) : null}
      <ul className={local.cells}>
        {cells.map((cell) => (
          <CounterCell
            key={cell.key}
            cell={cell}
            unknownLabel={t("admin.overview.cells.unknown")}
          />
        ))}
      </ul>
    </>
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

async function RecentSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchAudit(client, { table: null, rowId: null, limit: recentLimit });
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.audit.error.title")}
        text={t("admin.audit.error.text")}
        retryLabel={t("admin.audit.error.retry")}
        loadingLabel={t("admin.audit.error.retrying")}
      />
    );
  }
  if (result.status === "unavailable") {
    return (
      <EmptyState
        headingLevel={3}
        title={t("admin.audit.unavailable.title")}
        text={t("admin.audit.unavailable.text")}
      />
    );
  }
  if (result.data.length === 0) {
    return (
      <EmptyState
        headingLevel={3}
        title={t("admin.audit.empty.title")}
        text={t("admin.audit.empty.text")}
      />
    );
  }
  return (
    <AuditList
      entries={result.data.map(summarizeEntry)}
      labels={buildAuditListLabels(t)}
      locale={locale}
    />
  );
}

export default async function AdminOverviewPage({ params }: AdminProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  const auditEntry = staffNav.admin.find((entry) => entry.key === "audit");
  const sections = staffNav.admin.filter((entry) => entry.ready && entry.key !== "overview");
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.overview.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.overview.lead")}</p>
      </header>
      <div className={local.stack}>
        <section className={local.block} aria-labelledby="counters-title">
          <Heading level={2} size="h3" id="counters-title">
            {t("admin.overview.cells.title")}
          </Heading>
          <Suspense fallback={<Loading label={t("admin.overview.cells.loading")} />}>
            <CountersSection locale={locale} />
          </Suspense>
        </section>
        <Suspense fallback={<Loading label={t("admin.system.loading.omen")} />}>
          <OmenSection locale={locale} />
        </Suspense>
        <section className={local.block} aria-labelledby="recent-title">
          <Heading level={2} size="h3" id="recent-title">
            {t("admin.overview.recent.title")}
          </Heading>
          <Suspense fallback={<Loading label={t("admin.overview.recent.loading")} />}>
            <RecentSection locale={locale} />
          </Suspense>
          {auditEntry?.ready ? (
            <Link variant="arrow" href={`/${locale}/admin${auditEntry.path}`}>
              {t("admin.overview.recent.all")}
            </Link>
          ) : null}
        </section>
        <section className={local.block} aria-labelledby="sections-title">
          <Heading level={2} size="h3" id="sections-title">
            {t("admin.overview.sections.title")}
          </Heading>
          <ul className={local.sections}>
            {sections.map((entry) => (
              <li key={entry.key}>
                <Link href={`/${locale}/admin${entry.path}`}>{t(entry.label)}</Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
