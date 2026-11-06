import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { PayoutBuilder } from "@/components/admin/PayoutBuilder/PayoutBuilder";
import { PayoutList } from "@/components/admin/PayoutList/PayoutList";
import { PriceTabs } from "@/components/admin/PriceTabs/PriceTabs";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchPayouts, parsePayoutTab } from "@/lib/admin/payouts";
import { requireZone } from "@/lib/auth/session";
import { todayInMadrid } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type PayoutTab, payoutTabs } from "@/types/payouts";

import styles from "../admin.module.css";
import { buildPayoutAction, previewPayoutAction } from "./actions";
import { payoutBuilderLabels, payoutListLabels } from "./labels";
import page from "./liquidaciones.module.css";

interface PayoutsProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: Pick<PayoutsProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.payouts.meta.title") };
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function PayoutsSection({
  locale,
  tab,
  preselectId,
}: {
  locale: Locale;
  tab: PayoutTab;
  preselectId: string | undefined;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchPayouts(client);
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

  const { payouts, beneficiaries, defaultCadence } = result;
  const names = Object.fromEntries(beneficiaries.map((entry) => [entry.id, entry.full_name]));
  const counts: Record<PayoutTab, number> = {
    all: payouts.length,
    draft: payouts.filter((entry) => entry.status === "draft").length,
    issued: payouts.filter((entry) => entry.status === "issued").length,
    paid: payouts.filter((entry) => entry.status === "paid").length,
  };
  const shown = tab === "all" ? payouts : payouts.filter((entry) => entry.status === tab);

  return (
    <AnnouncerProvider>
      <div className={page.toolbar}>
        <PayoutBuilder
          beneficiaries={beneficiaries
            .filter((entry) => entry.is_active)
            .map((entry) => ({
              id: entry.id,
              name: entry.full_name,
              role: entry.role === "freelance" ? ("freelance" as const) : ("closer" as const),
              cadence: entry.payout_cadence ?? defaultCadence,
            }))}
          today={todayInMadrid()}
          locale={locale}
          preselectId={preselectId}
          labels={payoutBuilderLabels(t)}
          build={buildPayoutAction.bind(null, locale)}
          preview={previewPayoutAction.bind(null, locale)}
        />
      </div>
      <PriceTabs
        label={t("admin.payouts.tabsLabel")}
        items={payoutTabs.map((id) => ({
          id,
          label: `${t(`admin.payouts.tabs.${id}`)} (${String(counts[id])})`,
          href:
            id === "all"
              ? `/${locale}/admin/liquidaciones`
              : `/${locale}/admin/liquidaciones?tab=${id}`,
        }))}
        currentId={tab}
      />
      <section className={page.block} aria-label={t(`admin.payouts.tabs.${tab}`)}>
        {payouts.length === 0 ? (
          <EmptyState
            headingLevel={2}
            title={t("admin.payouts.empty.title")}
            text={t("admin.payouts.empty.text")}
          />
        ) : shown.length === 0 ? (
          <EmptyState
            headingLevel={2}
            title={t("admin.payouts.empty.tabTitle")}
            text={t("admin.payouts.empty.tabText")}
          />
        ) : (
          <PayoutList rows={shown} names={names} locale={locale} labels={payoutListLabels(t)} />
        )}
      </section>
    </AnnouncerProvider>
  );
}

export default async function PayoutsPage({ params, searchParams }: PayoutsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const query = await searchParams;
  const tab = parsePayoutTab(query.tab);
  const wanted = Array.isArray(query.beneficiario) ? query.beneficiario[0] : query.beneficiario;
  const preselectId = wanted !== undefined && uuidPattern.test(wanted) ? wanted : undefined;
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.payouts.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.payouts.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("admin.payouts.loading")}
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
        <PayoutsSection locale={locale} tab={tab} preselectId={preselectId} />
      </Suspense>
    </>
  );
}
