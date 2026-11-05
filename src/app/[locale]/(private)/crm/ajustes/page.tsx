import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import {
  RulesPanel,
  TelegramPanel,
} from "@/components/admin/NotificationPanels/NotificationPanels";
import { RateCard } from "@/components/crm/RateCard/RateCard";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { fetchMyRates } from "@/lib/crm/rates";
import { isOutboxDrainOn } from "@/lib/notifications/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { closerEvents, notificationEvents } from "@/types/notifications";

import styles from "../crm.module.css";
import local from "./ajustes.module.css";

interface SettingsProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SettingsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("crm.settings.meta.title") };
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
        </div>
      }
    >
      {null}
    </LoadingRegion>
  );
}

async function RatesPanel({ locale, userId }: { locale: Locale; userId: string }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchMyRates(client, userId);
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("crm.settings.rates.error.title")}
        text={t("crm.settings.rates.error.text")}
        retryLabel={t("crm.settings.rates.error.retry")}
        loadingLabel={t("crm.settings.rates.error.retrying")}
      />
    );
  }
  return (
    <RateCard
      rates={result.data}
      locale={locale}
      labels={{
        title: t("crm.settings.rates.title"),
        text: t("crm.settings.rates.text"),
        project: t("crm.settings.rates.project"),
        recurring: t("crm.settings.rates.recurring"),
        percent: t("crm.settings.rates.percent"),
        none: t("crm.settings.rates.none"),
      }}
    />
  );
}

export default async function SettingsPage({ params }: SettingsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("crm", locale);
  const t = await getTranslator(locale);
  const isAdmin = member.role === "admin";
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("crm.settings.title")}
        </Heading>
        <p className={styles.lead}>{t("crm.settings.lead")}</p>
      </header>
      <div className={local.stack}>
        {isOutboxDrainOn() ? null : (
          <div className={local.notice} role="note">
            <Heading level={2} size="h4">
              {t("admin.notifications.drainOff.title")}
            </Heading>
            <p>{t("admin.notifications.drainOff.text")}</p>
          </div>
        )}
        <Suspense fallback={<Loading label={t("crm.settings.loading.telegram")} />}>
          <TelegramPanel locale={locale} zone="crm" withTest={false} />
        </Suspense>
        <Suspense fallback={<Loading label={t("crm.settings.loading.rules")} />}>
          <RulesPanel
            locale={locale}
            zone="crm"
            userId={member.userId}
            events={isAdmin ? notificationEvents : closerEvents}
          />
        </Suspense>
        {isAdmin ? null : (
          <Suspense fallback={<Loading label={t("crm.settings.loading.rates")} />}>
            <RatesPanel locale={locale} userId={member.userId} />
          </Suspense>
        )}
      </div>
    </>
  );
}
