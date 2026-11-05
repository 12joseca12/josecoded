import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  RulesPanel,
  TelegramPanel,
} from "@/components/admin/NotificationPanels/NotificationPanels";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { isOutboxDrainOn } from "@/lib/notifications/config";
import { notificationEvents } from "@/types/notifications";

import styles from "../admin.module.css";
import local from "./notificaciones.module.css";

interface NotificationsProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NotificationsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.notifications.meta.title") };
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

export default async function NotificationsPage({ params }: NotificationsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.notifications.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.notifications.lead")}</p>
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
        <Suspense fallback={<Loading label={t("admin.notifications.loading.telegram")} />}>
          <TelegramPanel locale={locale} zone="admin" withTest />
        </Suspense>
        <Suspense fallback={<Loading label={t("admin.notifications.loading.rules")} />}>
          <RulesPanel
            locale={locale}
            zone="admin"
            userId={member.userId}
            events={notificationEvents}
          />
        </Suspense>
      </div>
    </>
  );
}
