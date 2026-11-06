import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CounterCell } from "@/components/admin/CounterCell/CounterCell";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { FeeHistoryTable } from "@/components/freelance/FeeHistoryTable/FeeHistoryTable";
import { FeeItemTable } from "@/components/freelance/FeeItemTable/FeeItemTable";
import { PayoutTable } from "@/components/freelance/PayoutTable/PayoutTable";
import { FilterTabs } from "@/components/staff/FilterTabs/FilterTabs";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { formatDay } from "@/lib/crm/contacts";
import {
  fetchCounters,
  fetchFeeItems,
  fetchFeeSummaries,
  fetchPayouts,
} from "@/lib/freelance/fees";
import { historyLabels, itemTableLabels, payoutTableLabels } from "@/lib/freelance/labels";
import { formatCents } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type FeeItemStatus, feeItemStatuses } from "@/types/freelance-fees";

import styles from "../freelance.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

interface PayProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: PayProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("freelance.pay.meta.title") };
}

function regionError(t: Awaited<ReturnType<typeof getTranslator>>) {
  return (
    <RefreshError
      title={t("freelance.pay.error.title")}
      text={t("freelance.pay.error.text")}
      retryLabel={t("freelance.pay.error.retry")}
      loadingLabel={t("freelance.pay.error.retrying")}
    />
  );
}

function RegionSkeleton({ label, height }: { label: string; height: string }) {
  return (
    <LoadingRegion loading label={label} fallback={<Skeleton height={height} />}>
      {null}
    </LoadingRegion>
  );
}

async function BalancesRegion({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const counters = client ? await fetchCounters(client) : null;
  const data = counters?.status === "ok" ? counters.data : {};
  const money = (value: number | undefined) =>
    value === undefined ? null : formatCents(value, locale);
  const unknown = t("freelance.pay.balances.unknown");
  const cells = [
    {
      key: "pending",
      label: t("freelance.pay.balances.pending"),
      value: money(data.fees_pending_amount),
    },
    {
      key: "owed",
      label: t("freelance.pay.balances.owed"),
      value: money(data.fees_owed_amount),
      highlight: true,
    },
    {
      key: "paidYear",
      label: t("freelance.pay.balances.paidYear"),
      value: money(data.fees_paid_year_amount),
    },
    {
      key: "lastPaid",
      label: t("freelance.pay.balances.lastPaid"),
      value: data.last_paid_at ? formatDay(data.last_paid_at, locale) : null,
    },
  ];
  return (
    <ul className={styles.counters} aria-label={t("freelance.pay.balances.label")}>
      {cells.map(({ key, ...cell }) => (
        <CounterCell key={key} cell={cell} unknownLabel={unknown} />
      ))}
    </ul>
  );
}

async function HistoryRegion({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const summaries = client ? await fetchFeeSummaries(client) : null;
  if (summaries?.status !== "ok") return regionError(t);
  if (summaries.data.length === 0) {
    return (
      <EmptyState
        headingLevel={3}
        title={t("freelance.pay.empty.title")}
        text={t("freelance.pay.empty.text")}
      />
    );
  }
  return (
    <FeeHistoryTable
      rows={summaries.data}
      locale={locale}
      labels={historyLabels(t)}
      hrefFor={(id) => `/${locale}/freelance/proyectos/${id}`}
    />
  );
}

async function PayoutsRegion({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const payouts = client ? await fetchPayouts(client) : null;
  if (payouts?.status !== "ok") return regionError(t);
  if (payouts.data.length === 0)
    return <p className={styles.muted}>{t("freelance.pay.payouts.empty")}</p>;
  return (
    <PayoutTable
      rows={payouts.data}
      locale={locale}
      labels={payoutTableLabels(t)}
      hrefFor={(id) => `/${locale}/freelance/pagos/${id}`}
    />
  );
}

async function ItemsRegion({ locale, filter }: { locale: Locale; filter: FeeItemStatus | null }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const [summaries, items] = client
    ? await Promise.all([fetchFeeSummaries(client), fetchFeeItems(client)])
    : [null, null];
  if (summaries?.status !== "ok" || items?.status !== "ok") return regionError(t);
  const base = `/${locale}/freelance/pagos`;
  const count = (status: FeeItemStatus) =>
    items.data.filter((item) => item.status === status).length;
  const shown = filter === null ? items.data : items.data.filter((item) => item.status === filter);
  return (
    <>
      <FilterTabs
        label={t("freelance.pay.items.filters")}
        items={[
          {
            key: "all",
            label: t("freelance.pay.items.all"),
            count: items.data.length,
            href: base,
            current: filter === null,
          },
          ...feeItemStatuses.map((status) => ({
            key: status,
            label: t(`freelance.fees.statuses.${status}`),
            count: count(status),
            href: `${base}?estado=${status}`,
            current: filter === status,
          })),
        ]}
      />
      <FeeItemTable
        items={shown}
        projectNames={Object.fromEntries(
          summaries.data.map((row) => [row.fee_id, row.project_name]),
        )}
        locale={locale}
        labels={itemTableLabels(t)}
      />
    </>
  );
}

function parseFilter(value: string | string[] | undefined): FeeItemStatus | null {
  const single = Array.isArray(value) ? value[0] : value;
  return feeItemStatuses.find((status) => status === single) ?? null;
}

export default async function FreelancePayPage({ params, searchParams }: PayProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireZone("freelance", locale);
  const t = await getTranslator(locale);
  const loading = t("freelance.pay.loading");
  return (
    <div className={styles.stack}>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("freelance.pay.title")}
        </Heading>
        <p className={styles.lead}>{t("freelance.pay.lead")}</p>
      </header>
      <Suspense fallback={<RegionSkeleton label={loading} height="6rem" />}>
        <BalancesRegion locale={locale} />
      </Suspense>
      <section className={styles.section} aria-labelledby="pay-history">
        <Heading level={2} size="h4" id="pay-history">
          {t("freelance.pay.history.title")}
        </Heading>
        <Suspense fallback={<RegionSkeleton label={loading} height="8rem" />}>
          <HistoryRegion locale={locale} />
        </Suspense>
      </section>
      <section className={styles.section} aria-labelledby="pay-payouts">
        <Heading level={2} size="h4" id="pay-payouts">
          {t("freelance.pay.payouts.title")}
        </Heading>
        <Suspense fallback={<RegionSkeleton label={loading} height="6rem" />}>
          <PayoutsRegion locale={locale} />
        </Suspense>
      </section>
      <section className={styles.section} aria-labelledby="pay-items">
        <Heading level={2} size="h4" id="pay-items">
          {t("freelance.pay.items.title")}
        </Heading>
        <Suspense fallback={<RegionSkeleton label={loading} height="8rem" />}>
          <ItemsRegion locale={locale} filter={parseFilter(query.estado)} />
        </Suspense>
      </section>
    </div>
  );
}
