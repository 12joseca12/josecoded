import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CounterCell } from "@/components/admin/CounterCell/CounterCell";
import { DueList } from "@/components/crm/DueList/DueList";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { formatDay } from "@/lib/crm/contacts";
import {
  buildStageCells,
  buildTodayCells,
  fetchCrmCounters,
  fetchDue,
  primaryAction,
} from "@/lib/crm/overview";
import { cellLabels, dueListLabels } from "@/lib/crm/overview-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "./crm.module.css";
import local from "./overview.module.css";

interface CrmProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CrmProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("crm.overview.meta.title") };
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

async function CountersSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchCrmCounters(client);
  if (result.status === "error") {
    return (
      <RefreshError
        title={t("crm.overview.cells.error.title")}
        text={t("crm.overview.cells.error.text")}
        retryLabel={t("crm.overview.cells.error.retry")}
        loadingLabel={t("crm.overview.cells.error.retrying")}
      />
    );
  }
  const counters = result.status === "ok" ? result.data : null;
  const labels = cellLabels(t);
  const unknown = t("crm.overview.cells.unknown");
  const action = primaryAction(counters);
  return (
    <>
      <section className={local.block} aria-labelledby="today-title">
        <Heading level={2} size="h3" id="today-title">
          {t("crm.overview.today.title")}
        </Heading>
        {result.status === "unavailable" ? (
          <div className={local.notice} role="status">
            <Heading level={3} size="h4">
              {t("crm.overview.cells.unavailable.title")}
            </Heading>
            <p>{t("crm.overview.cells.unavailable.text")}</p>
          </div>
        ) : null}
        <ul className={local.cells}>
          {buildTodayCells(counters, labels, locale).map((cell) => (
            <CounterCell key={cell.key} cell={cell} unknownLabel={unknown} />
          ))}
        </ul>
        {action === null ? null : (
          <div className={local.actions}>
            <Button
              href={`/${locale}/crm${action === "overdue" ? "/contactos?due=1" : "/interesados"}`}
              variant="accent"
            >
              {t(
                action === "overdue"
                  ? "crm.overview.today.viewOverdue"
                  : "crm.overview.today.viewLeads",
              )}
            </Button>
          </div>
        )}
      </section>
      <section className={local.block} aria-labelledby="pipeline-title">
        <Heading level={2} size="h3" id="pipeline-title">
          {t("crm.overview.pipeline.title")}
        </Heading>
        <ul className={local.cells}>
          {buildStageCells(counters, labels, locale).map((cell) => (
            <CounterCell key={cell.key} cell={cell} unknownLabel={unknown} />
          ))}
        </ul>
      </section>
    </>
  );
}

async function DueSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const now = new Date();
  const result = await fetchDue(client, now);
  if (result.status === "error") {
    return (
      <RefreshError
        title={t("crm.overview.due.error.title")}
        text={t("crm.overview.due.error.text")}
        retryLabel={t("crm.overview.due.error.retry")}
        loadingLabel={t("crm.overview.due.error.retrying")}
      />
    );
  }
  const { rows, next } = result.data;
  if (rows.length === 0) {
    const nextText = next
      ? (next.next_action
          ? t("crm.overview.due.empty.next").replace("{action}", next.next_action)
          : t("crm.overview.due.empty.nextNoAction")
        ).replace("{date}", formatDay(next.next_action_at, locale))
      : null;
    return (
      <div className={local.upToDate}>
        <EmptyState
          headingLevel={3}
          title={t("crm.overview.due.empty.title")}
          text={t("crm.overview.due.empty.text")}
        />
        {nextText ? <p className={local.next}>{nextText}</p> : null}
      </div>
    );
  }
  return (
    <DueList rows={rows} labels={dueListLabels(t)} locale={locale} nowIso={now.toISOString()} />
  );
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
      <div className={local.stack}>
        <Suspense fallback={<Loading label={t("crm.overview.loading")} />}>
          <CountersSection locale={locale} />
        </Suspense>
        <section className={local.block} aria-labelledby="due-title">
          <Heading level={2} size="h3" id="due-title">
            {t("crm.overview.due.title")}
          </Heading>
          <Suspense fallback={<Loading label={t("crm.overview.due.loading")} />}>
            <DueSection locale={locale} />
          </Suspense>
          <Link variant="arrow" href={`/${locale}/crm/contactos`}>
            {t("crm.overview.due.all")}
          </Link>
        </section>
      </div>
    </>
  );
}
