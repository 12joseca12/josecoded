import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { LeadTable } from "@/components/admin/LeadTable/LeadTable";
import { NewLeadSheet } from "@/components/admin/NewLeadSheet/NewLeadSheet";
import { FilterBar } from "@/components/staff/FilterBar/FilterBar";
import { FilterTabs } from "@/components/staff/FilterTabs/FilterTabs";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import {
  countByTab,
  filterLeads,
  hasFieldFilters,
  leadQueryMax,
  type LeadSearchParams,
  leadsHref,
  noneValue,
  parseLeadFilters,
} from "@/lib/admin/lead-filters";
import { leadTabLabels, leadTableLabels, newLeadLabels } from "@/lib/admin/lead-labels";
import { fetchLeads } from "@/lib/admin/leads";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type LeadFilters, leadSources, leadTabs, leadVias } from "@/types/leads";

import styles from "../admin.module.css";
import { assignLead, createLead, discardLead } from "./actions";

interface LeadsProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<LeadSearchParams>;
}

export async function generateMetadata({ params }: LeadsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.leads.meta.title") };
}

async function LeadsSection({ locale, filters }: { locale: Locale; filters: LeadFilters }) {
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

  const basePath = `/${locale}/admin/interesados`;
  const sheet = (
    <NewLeadSheet
      labels={newLeadLabels(t)}
      assignees={result.assignees}
      create={createLead.bind(null, locale)}
      detailBase={basePath}
    />
  );

  if (result.rows.length === 0) {
    return (
      <>
        {sheet}
        <EmptyState
          headingLevel={2}
          title={t("admin.leads.empty.title")}
          text={t("admin.leads.empty.text")}
        />
      </>
    );
  }

  const tabLabels = leadTabLabels(t);
  const counts = countByTab(result.rows, filters);
  const visible = filterLeads(result.rows, filters);
  const labels = leadTableLabels(t);

  return (
    <>
      {sheet}
      <FilterTabs
        label={t("admin.leads.tabs.label")}
        items={leadTabs.map((tab) => ({
          key: tab,
          label: tabLabels[tab],
          count: counts[tab],
          href: leadsHref(basePath, filters, tab),
          current: tab === filters.tab,
        }))}
      />
      <FilterBar
        label={t("admin.leads.filters.label")}
        action={basePath}
        hidden={filters.tab === "all" ? {} : { status: filters.tab }}
        submitLabel={t("admin.leads.filters.submit")}
        clearLabel={t("admin.leads.filters.clear")}
        clearHref={leadsHref(
          basePath,
          { ...filters, via: null, source: null, owner: null, q: "" },
          filters.tab,
        )}
        active={hasFieldFilters(filters)}
        fields={[
          {
            kind: "search",
            name: "q",
            label: t("admin.leads.filters.q"),
            value: filters.q,
            maxLength: leadQueryMax,
          },
          {
            kind: "select",
            name: "via",
            label: t("admin.leads.filters.via"),
            value: filters.via ?? "",
            options: [
              { value: "", label: t("admin.leads.filters.anyVia") },
              ...leadVias.map((via) => ({ value: via, label: labels.via[via] })),
              { value: noneValue, label: labels.via.none },
            ],
          },
          {
            kind: "select",
            name: "source",
            label: t("admin.leads.filters.source"),
            value: filters.source ?? "",
            options: [
              { value: "", label: t("admin.leads.filters.anySource") },
              ...leadSources.map((source) => ({ value: source, label: labels.sources[source] })),
            ],
          },
          {
            kind: "select",
            name: "owner",
            label: t("admin.leads.filters.owner"),
            value: filters.owner ?? "",
            options: [
              { value: "", label: t("admin.leads.filters.anyOwner") },
              { value: noneValue, label: labels.unassigned },
              ...result.assignees.map((person) => ({ value: person.id, label: person.name })),
            ],
          },
        ]}
      />
      {visible.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title={t("admin.leads.emptyFiltered.title")}
          text={t("admin.leads.emptyFiltered.text")}
        />
      ) : (
        <LeadTable
          rows={visible}
          assignees={result.assignees}
          locale={locale}
          detailBase={basePath}
          labels={labels}
          assign={assignLead.bind(null, locale)}
          discard={discardLead.bind(null, locale)}
        />
      )}
      {result.rows.length >= result.limit ? (
        <p className={styles.note}>
          {t("admin.leads.limit").replace("{count}", String(result.limit))}
        </p>
      ) : null}
    </>
  );
}

export default async function LeadsPage({ params, searchParams }: LeadsProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  const filters = parseLeadFilters(query);
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
        <LeadsSection locale={locale} filters={filters} />
      </Suspense>
    </>
  );
}
