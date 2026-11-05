import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CommissionHeaderTable } from "@/components/crm/CommissionHeaderTable/CommissionHeaderTable";
import { CommissionLineTable } from "@/components/crm/CommissionLineTable/CommissionLineTable";
import { CommissionTotals } from "@/components/crm/CommissionTotals/CommissionTotals";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { FilterTabs } from "@/components/staff/FilterTabs/FilterTabs";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import {
  computeTotals,
  fetchCommissions,
  filterLines,
  parseCommissionFilter,
  parseCommissionView,
} from "@/lib/crm/commissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import { type CommissionFilter, commissionFilters, type CommissionView } from "@/types/commissions";

import styles from "../crm.module.css";
import { approveLinesAction, rejectLineAction } from "./actions";
import page from "./comisiones.module.css";
import { headerTableLabels, lineTableLabels, totalsLabels } from "./labels";

interface CommissionsProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: Pick<CommissionsProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("crm.commissions.meta.title") };
}

interface SectionProps {
  locale: Locale;
  role: UserRole;
  filter: CommissionFilter | null;
  view: CommissionView;
}

function hrefFor(locale: string, view: CommissionView, filter: CommissionFilter | null): string {
  const query = new URLSearchParams();
  if (view !== "lines") query.set("view", view);
  if (filter !== null) query.set("status", filter);
  const text = query.toString();
  return `/${locale}/crm/comisiones${text === "" ? "" : `?${text}`}`;
}

async function CommissionsSection({ locale, role, filter, view }: SectionProps) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchCommissions(client);
  if (result.status === "error") {
    return (
      <RefreshError
        title={t("crm.commissions.error.title")}
        text={t("crm.commissions.error.text")}
        retryLabel={t("crm.commissions.error.retry")}
        loadingLabel={t("crm.commissions.error.retrying")}
      />
    );
  }

  const { lines, headers, payouts, names } = result;
  const totals = computeTotals(lines);
  const shown = filterLines(lines, filter);
  const hrefs = {
    all: hrefFor(locale, "lines", null),
    ...Object.fromEntries(
      commissionFilters.map((entry) => [entry, hrefFor(locale, "lines", entry)]),
    ),
  } as Record<CommissionFilter | "all", string>;

  return (
    <AnnouncerProvider>
      <FilterTabs
        label={t("crm.commissions.views.label")}
        items={[
          {
            key: "lines",
            label: t("crm.commissions.views.lines"),
            count: lines.length,
            href: hrefFor(locale, "lines", null),
            current: view === "lines",
          },
          {
            key: "headers",
            label: t("crm.commissions.views.headers"),
            count: headers.length,
            href: hrefFor(locale, "headers", null),
            current: view === "headers",
          },
        ]}
      />
      {view === "headers" ? (
        headers.length === 0 ? (
          <p className={page.note}>{t("crm.commissions.headers.empty")}</p>
        ) : (
          <CommissionHeaderTable
            rows={headers}
            lines={lines}
            names={names}
            locale={locale}
            labels={headerTableLabels(t)}
          />
        )
      ) : (
        <>
          <CommissionTotals
            totals={totals}
            active={filter}
            hrefs={hrefs}
            locale={locale}
            labels={totalsLabels(t)}
          />
          {lines.length === 0 ? (
            <EmptyState
              headingLevel={2}
              title={t("crm.commissions.empty.title")}
              text={t("crm.commissions.empty.text")}
            />
          ) : shown.length === 0 ? (
            <EmptyState
              headingLevel={2}
              title={t("crm.commissions.empty.filterTitle")}
              text={t("crm.commissions.empty.filterText")}
            />
          ) : (
            <CommissionLineTable
              rows={shown}
              names={names}
              payouts={payouts}
              locale={locale}
              canApprove={role === "admin"}
              labels={lineTableLabels(t)}
              approve={approveLinesAction.bind(null, locale)}
              reject={rejectLineAction.bind(null, locale)}
            />
          )}
        </>
      )}
    </AnnouncerProvider>
  );
}

export default async function CommissionsPage({ params, searchParams }: CommissionsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("crm", locale);
  const query = await searchParams;
  const filter = parseCommissionFilter(query.status);
  const view = parseCommissionView(query.view);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={page.head}>
        <Heading level={1} size="h2">
          {t("crm.commissions.title")}
        </Heading>
        <p className={page.lead}>
          {member.role === "admin"
            ? t("crm.commissions.leadAdmin")
            : t("crm.commissions.leadCloser")}
        </p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("crm.commissions.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="4.5rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <CommissionsSection locale={locale} role={member.role} filter={filter} view={view} />
      </Suspense>
    </>
  );
}
