import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DocumentTable } from "@/components/admin/DocumentTable/DocumentTable";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { PriceTabs } from "@/components/admin/PriceTabs/PriceTabs";
import { ReceivableTable } from "@/components/admin/ReceivableTable/ReceivableTable";
import { RecordPaymentSheet } from "@/components/admin/RecordPaymentSheet/RecordPaymentSheet";
import { ScheduleSheet } from "@/components/admin/ScheduleSheet/ScheduleSheet";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import {
  fetchReceivables,
  filterReceivables,
  parsePaymentTab,
  tabCounts,
} from "@/lib/admin/payments";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type PaymentTab, paymentTabs } from "@/types/payments";

import styles from "../admin.module.css";
import {
  cancelItemAction,
  issueProformaAction,
  recordInvoiceAction,
  recordPaymentAction,
  setScheduleAction,
  voidInvoiceAction,
} from "./actions";
import page from "./cobros.module.css";
import {
  confirmLabels,
  documentTableLabels,
  invoiceSheetLabels,
  proformaSheetLabels,
  receivableActionLabels,
  receivableTableLabels,
  recordPaymentLabels,
  scheduleSheetLabels,
} from "./labels";

interface PaymentsProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: Pick<PaymentsProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.payments.meta.title") };
}

function madridToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

async function PaymentsSection({ locale, tab }: { locale: Locale; tab: PaymentTab }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchReceivables(client);

  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.payments.error.title")}
        text={t("admin.payments.error.text")}
        retryLabel={t("admin.payments.error.retry")}
        loadingLabel={t("admin.payments.error.retrying")}
      />
    );
  }

  const { deals, schedule, documents, paidBySchedule, vatRate } = result;
  const today = madridToday();
  const counts = tabCounts(schedule, documents, today);
  const vat = String(vatRate);
  const handlers = {
    record: recordPaymentAction.bind(null, locale),
    schedule: setScheduleAction.bind(null, locale),
    proforma: issueProformaAction.bind(null, locale),
    invoice: recordInvoiceAction.bind(null, locale),
    cancelItem: cancelItemAction.bind(null, locale),
    voidInvoice: voidInvoiceAction.bind(null, locale),
  };
  const confirm = confirmLabels(t);
  const dealOptions = deals.map((deal) => ({
    id: deal.id,
    label: deal.contacts?.full_name ?? "—",
    wonCents: deal.won_amount ?? 0,
  }));

  const tabItems = paymentTabs.map((id) => ({
    id,
    label: `${t(`admin.payments.tabs.${id}`)} (${String(counts[id])})`,
    href: id === "pending" ? `/${locale}/admin/cobros` : `/${locale}/admin/cobros?tab=${id}`,
  }));

  const rows = filterReceivables(schedule, tab, today);
  const documentRows = documents.filter(
    (entry) => entry.kind === (tab === "proformas" ? "proforma" : "invoice"),
  );
  const isDocumentTab = tab === "proformas" || tab === "invoices";
  const nothing = schedule.length === 0 && documents.length === 0;

  return (
    <AnnouncerProvider>
      <div className={page.toolbar}>
        <ScheduleSheet
          deals={dealOptions.filter((deal) => deal.wonCents > 0)}
          labels={scheduleSheetLabels(t)}
          save={handlers.schedule}
          locale={locale}
        />
        <RecordPaymentSheet
          deals={dealOptions}
          schedule={schedule
            .filter((item) => item.status !== "cancelled")
            .map((item) => ({
              id: item.id,
              dealId: item.deal_id,
              label: item.label,
              nature: item.kind === "recurring" ? "recurring" : "project",
              remainingCents: Math.max(0, item.amount - (paidBySchedule[item.id] ?? 0)),
            }))}
          invoices={documents
            .filter((item) => item.status !== "void")
            .map((item) => ({ id: item.id, dealId: item.deal_id, label: item.number }))}
          labels={recordPaymentLabels(t)}
          record={handlers.record}
          today={today}
          trigger={{ text: t("admin.payments.record.open"), variant: "primary", size: "md" }}
        />
      </div>
      <PriceTabs label={t("admin.payments.tabsLabel")} items={tabItems} currentId={tab} />
      <section className={page.block} aria-label={t(`admin.payments.tabs.${tab}`)}>
        {nothing ? (
          <EmptyState
            headingLevel={2}
            title={t("admin.payments.empty.title")}
            text={t("admin.payments.empty.text")}
          />
        ) : isDocumentTab ? (
          documentRows.length === 0 ? (
            <p className={styles.note}>{t("admin.payments.documents.empty")}</p>
          ) : (
            <DocumentTable
              rows={documentRows}
              locale={locale}
              labels={documentTableLabels(t)}
              confirm={confirm}
              voidDocument={handlers.voidInvoice}
            />
          )
        ) : rows.length === 0 ? (
          <EmptyState
            headingLevel={2}
            title={t("admin.payments.empty.tabTitle")}
            text={t("admin.payments.empty.tabText")}
          />
        ) : (
          <ReceivableTable
            rows={rows}
            schedule={schedule}
            documents={documents}
            paidBySchedule={paidBySchedule}
            locale={locale}
            today={today}
            vat={vat}
            labels={receivableTableLabels(t)}
            actionLabels={{
              actions: receivableActionLabels(t),
              record: recordPaymentLabels(t),
              proforma: proformaSheetLabels(t),
              invoice: invoiceSheetLabels(t),
              confirm,
            }}
            handlers={handlers}
          />
        )}
      </section>
    </AnnouncerProvider>
  );
}

export default async function PaymentsPage({ params, searchParams }: PaymentsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const query = await searchParams;
  const tab = parsePaymentTab(query.tab);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.payments.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.payments.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("admin.payments.loading")}
            fallback={
              <div className={styles.skeleton}>
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
        <PaymentsSection locale={locale} tab={tab} />
      </Suspense>
    </>
  );
}
