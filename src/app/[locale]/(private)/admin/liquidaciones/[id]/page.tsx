import type { Metadata } from "next";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { PayoutActions } from "@/components/admin/PayoutActions/PayoutActions";
import { PayoutInvoice } from "@/components/admin/PayoutInvoice/PayoutInvoice";
import { StatementPrint } from "@/components/admin/StatementPrint/StatementPrint";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { PrintButton } from "@/components/ui/PrintButton/PrintButton";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchPayoutDetail } from "@/lib/admin/payouts";
import { requireZone } from "@/lib/auth/session";
import { formatCents } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "../../admin.module.css";
import {
  deletePayoutDraftAction,
  issuePayoutAction,
  payPayoutAction,
  uploadPayoutInvoiceAction,
} from "../actions";
import { payoutActionsLabels, payoutInvoiceLabels, statementLabels } from "../labels";
import page from "../liquidaciones.module.css";

interface DetailProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: DetailProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.payouts.meta.title"), robots: { index: false, follow: false } };
}

function madridToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

async function DetailSection({ locale, id }: { locale: Locale; id: string }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchPayoutDetail(client, id);
  if (result.status === "missing") notFound();
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.payouts.error.title")}
        text={t("admin.payouts.error.text")}
        retryLabel={t("admin.payouts.error.retry")}
        loadingLabel={t("admin.payouts.error.retrying")}
      />
    );
  }

  const { payout, lines, beneficiary } = result;
  const backHref = `/${locale}/admin/liquidaciones`;
  const labels = statementLabels(t);
  return (
    <AnnouncerProvider>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.payouts.detail.heading").replace("{name}", beneficiary)}
        </Heading>
      </header>
      <div className={page.controls} data-print="hide">
        <PrintButton label={labels.print} />
        <p className={page.hint}>{labels.printHint}</p>
      </div>
      <StatementPrint
        payout={payout}
        lines={lines}
        beneficiary={beneficiary}
        locale={locale}
        labels={labels}
      />
      <div className={page.panels} data-print="hide">
        <section className={page.panel} aria-labelledby="payout-actions">
          <Heading level={2} size="h4" id="payout-actions">
            {t("admin.payouts.actions.title")}
          </Heading>
          <PayoutActions
            id={payout.id}
            status={payout.status}
            netText={formatCents(payout.net_total, locale)}
            beneficiary={beneficiary}
            today={madridToday()}
            backHref={backHref}
            labels={payoutActionsLabels(t)}
            issue={issuePayoutAction.bind(null, locale)}
            pay={payPayoutAction.bind(null, locale)}
            remove={deletePayoutDraftAction.bind(null, locale)}
          />
        </section>
        <PayoutInvoice
          id={payout.id}
          hasInvoice={payout.closer_invoice_path !== null}
          openHref={`/${locale}/admin/liquidaciones/${payout.id}/factura`}
          labels={payoutInvoiceLabels(t)}
          upload={uploadPayoutInvoiceAction.bind(null, locale)}
        />
      </div>
    </AnnouncerProvider>
  );
}

export default async function PayoutDetailPage({ params }: DetailProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <>
      <div className={page.back} data-print="hide">
        <NextLink href={`/${locale}/admin/liquidaciones`} className={page.backLink}>
          {t("admin.payouts.detail.back")}
        </NextLink>
      </div>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("admin.payouts.detail.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="6rem" />
                <Skeleton height="12rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <DetailSection locale={locale} id={id} />
      </Suspense>
    </>
  );
}
