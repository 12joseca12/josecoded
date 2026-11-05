import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AuditList } from "@/components/admin/AuditList/AuditList";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { FilterBar } from "@/components/staff/FilterBar/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import {
  auditHref,
  type AuditSearchParams,
  fetchAudit,
  filterByAction,
  hasAuditFilters,
  nextLimit,
  parseAuditFilters,
  summarizeEntry,
} from "@/lib/admin/audit";
import { buildAuditListLabels } from "@/lib/admin/audit-labels";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auditActions, type AuditFilters, auditTables } from "@/types/audit";

import styles from "../admin.module.css";
import local from "./auditoria.module.css";

interface AuditPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<AuditSearchParams>;
}

export async function generateMetadata({ params }: AuditPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.audit.meta.title") };
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

async function AuditSection({ locale, filters }: { locale: Locale; filters: AuditFilters }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchAudit(client, {
    table: filters.table,
    rowId: null,
    limit: filters.limit,
  });
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
        headingLevel={2}
        title={t("admin.audit.unavailable.title")}
        text={t("admin.audit.unavailable.text")}
      />
    );
  }
  const loaded = result.data.length;
  const rows = filterByAction(result.data, filters.action);
  if (rows.length === 0 && loaded === 0 && !hasAuditFilters(filters)) {
    return (
      <EmptyState
        headingLevel={2}
        title={t("admin.audit.empty.title")}
        text={t("admin.audit.empty.text")}
      />
    );
  }
  const basePath = `/${locale}/admin/auditoria`;
  const more = loaded >= filters.limit && filters.limit < nextLimit(filters.limit);
  return (
    <>
      {rows.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title={t("admin.audit.emptyFiltered.title")}
          text={t("admin.audit.emptyFiltered.text")}
        />
      ) : (
        <AuditList
          entries={rows.map(summarizeEntry)}
          labels={buildAuditListLabels(t)}
          locale={locale}
          variant="full"
        />
      )}
      {filters.action ? <p className={styles.note}>{t("admin.audit.filteredNote")}</p> : null}
      {more ? (
        <Link
          variant="arrow"
          href={auditHref(basePath, { ...filters, limit: nextLimit(filters.limit) })}
        >
          {t("admin.audit.more")}
        </Link>
      ) : loaded >= filters.limit ? (
        <p className={styles.note}>
          {t("admin.audit.limit").replace("{count}", String(filters.limit))}
        </p>
      ) : null}
    </>
  );
}

export default async function AuditPage({ params, searchParams }: AuditPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  const filters = parseAuditFilters(query);
  const basePath = `/${locale}/admin/auditoria`;
  const label = (path: string) => t(`admin.audit.${path}` as MessageKey);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.audit.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.audit.lead")}</p>
      </header>
      <div className={local.stack}>
        <FilterBar
          label={t("admin.audit.filters.label")}
          action={basePath}
          submitLabel={t("admin.audit.filters.submit")}
          clearLabel={t("admin.audit.filters.clear")}
          clearHref={basePath}
          active={hasAuditFilters(filters)}
          fields={[
            {
              kind: "select",
              name: "tabla",
              label: t("admin.audit.filters.table"),
              value: filters.table ?? "",
              options: [
                { value: "", label: t("admin.audit.filters.tableAll") },
                ...auditTables.map((name) => ({ value: name, label: label(`tables.${name}`) })),
              ],
            },
            {
              kind: "select",
              name: "accion",
              label: t("admin.audit.filters.action"),
              value: filters.action ?? "",
              options: [
                { value: "", label: t("admin.audit.filters.actionAll") },
                ...auditActions.map((name) => ({ value: name, label: label(`actions.${name}`) })),
              ],
            },
          ]}
        />
        <Suspense
          key={`${filters.table}-${filters.action}-${filters.limit}`}
          fallback={<Loading label={t("admin.audit.loading")} />}
        >
          <AuditSection locale={locale} filters={filters} />
        </Suspense>
      </div>
    </>
  );
}
