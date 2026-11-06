import { notFound } from "next/navigation";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { RuleMatrix } from "@/components/admin/RuleMatrix/RuleMatrix";
import { TelegramLinkCard } from "@/components/admin/TelegramLinkCard/TelegramLinkCard";
import { TestSender } from "@/components/admin/TestSender/TestSender";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import {
  generateTelegramCode,
  savePref,
  sendTestNotification,
  unlinkTelegram,
} from "@/lib/notifications/actions";
import { readBotUsername } from "@/lib/notifications/config";
import { fetchPrefs, fetchTelegramStatus } from "@/lib/notifications/data";
import {
  buildRuleMatrixLabels,
  buildTelegramLabels,
  buildTestSenderLabels,
} from "@/lib/notifications/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NotificationEvent } from "@/types/notifications";
import type { StaffZone } from "@/types/staff";

import styles from "./NotificationPanels.module.css";

interface PanelProps {
  locale: Locale;
  zone: StaffZone;
}

export async function TelegramPanel({
  locale,
  zone,
  withTest,
}: Omit<PanelProps, "zone"> & { zone: StaffZone | "account"; withTest: boolean }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchTelegramStatus(client);
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.notifications.telegram.error.title")}
        text={t("admin.notifications.telegram.error.text")}
        retryLabel={t("admin.notifications.telegram.error.retry")}
        loadingLabel={t("admin.notifications.telegram.error.retrying")}
      />
    );
  }
  if (result.status === "unavailable") {
    return (
      <EmptyState
        headingLevel={2}
        title={t("admin.notifications.telegram.unavailable.title")}
        text={t("admin.notifications.telegram.unavailable.text")}
      />
    );
  }
  const status = result.data;
  return (
    <div className={styles.stack}>
      <TelegramLinkCard
        status={status}
        botUsername={readBotUsername()}
        labels={buildTelegramLabels(t)}
        locale={locale}
        generate={generateTelegramCode.bind(null, zone, locale)}
        unlink={unlinkTelegram.bind(null, zone, locale)}
      />
      {withTest ? (
        <TestSender
          labels={buildTestSenderLabels(t)}
          telegramLinked={status.linkedAt !== null}
          send={sendTestNotification.bind(null, zone, locale)}
        />
      ) : null}
    </div>
  );
}

export async function RulesPanel({
  locale,
  zone,
  userId,
  events,
}: PanelProps & { userId: string; events: readonly NotificationEvent[] }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchPrefs(client, userId);
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.notifications.rules.error.title")}
        text={t("admin.notifications.rules.error.text")}
        retryLabel={t("admin.notifications.rules.error.retry")}
        loadingLabel={t("admin.notifications.rules.error.retrying")}
      />
    );
  }
  if (result.status === "unavailable") {
    return (
      <EmptyState
        headingLevel={2}
        title={t("admin.notifications.rules.unavailable.title")}
        text={t("admin.notifications.rules.unavailable.text")}
      />
    );
  }
  return (
    <section className={styles.rules} aria-labelledby="rules-title">
      <header className={styles.head}>
        <Heading level={2} size="h4" id="rules-title">
          {t("admin.notifications.rules.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.notifications.rules.lead")}</p>
      </header>
      <RuleMatrix
        matrix={result.data}
        events={events}
        labels={buildRuleMatrixLabels(t)}
        save={savePref.bind(null, zone, locale)}
      />
    </section>
  );
}
