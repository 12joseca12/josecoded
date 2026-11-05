import type { MessageKey } from "@/i18n/keys.generated";
import {
  notificationChannels,
  notificationEvents,
  type RuleMatrixLabels,
  type TelegramLinkLabels,
  type TestChannel,
  testChannels,
  type TestSenderLabels,
} from "@/types/notifications";

type Translate = (key: MessageKey) => string;

function mapOf<K extends string, V>(keys: readonly K[], build: (key: K) => V): Record<K, V> {
  return Object.fromEntries(keys.map((key) => [key, build(key)])) as Record<K, V>;
}

export function buildTelegramLabels(t: Translate): TelegramLinkLabels {
  return {
    title: t("admin.notifications.telegram.title"),
    text: t("admin.notifications.telegram.text"),
    linked: t("admin.notifications.telegram.linked"),
    unlinked: t("admin.notifications.telegram.unlinked"),
    noBot: {
      title: t("admin.notifications.telegram.noBot.title"),
      text: t("admin.notifications.telegram.noBot.text"),
    },
    generate: t("admin.notifications.telegram.generate"),
    generating: t("admin.notifications.telegram.generating"),
    codeTitle: t("admin.notifications.telegram.codeTitle"),
    codeHelp: t("admin.notifications.telegram.codeHelp"),
    open: t("admin.notifications.telegram.open"),
    check: t("admin.notifications.telegram.check"),
    checking: t("admin.notifications.telegram.checking"),
    stillPending: t("admin.notifications.telegram.stillPending"),
    unlink: t("admin.notifications.telegram.unlink"),
    unlinking: t("admin.notifications.telegram.unlinking"),
    confirmUnlink: t("admin.notifications.telegram.confirmUnlink"),
    confirmYes: t("admin.notifications.telegram.confirmYes"),
    confirmNo: t("admin.notifications.telegram.confirmNo"),
    done: {
      linked: t("admin.notifications.telegram.done.linked"),
      unlinked: t("admin.notifications.telegram.done.unlinked"),
    },
    errors: {
      forbidden: t("admin.notifications.telegram.errors.forbidden"),
      unavailable: t("admin.notifications.telegram.errors.unavailable"),
      error: t("admin.notifications.telegram.errors.error"),
    },
  };
}

export function buildRuleMatrixLabels(t: Translate): RuleMatrixLabels {
  return {
    region: t("admin.notifications.rules.region"),
    caption: t("admin.notifications.rules.caption"),
    event: t("admin.notifications.rules.event"),
    channels: mapOf(notificationChannels, (channel) =>
      t(`admin.notifications.rules.channels.${channel}`),
    ),
    events: mapOf(notificationEvents, (event) => t(`admin.notifications.rules.events.${event}`)),
    idle: t("admin.notifications.rules.idle"),
    telegramNote: t("admin.notifications.rules.telegramNote"),
    saved: t("admin.notifications.rules.saved"),
    errors: {
      forbidden: t("admin.notifications.rules.errors.forbidden"),
      unavailable: t("admin.notifications.rules.errors.unavailable"),
      error: t("admin.notifications.rules.errors.error"),
    },
  };
}

export function buildTestSenderLabels(t: Translate): TestSenderLabels {
  const byChannel = (build: (channel: TestChannel) => string) => mapOf(testChannels, build);
  return {
    title: t("admin.notifications.test.title"),
    text: t("admin.notifications.test.text"),
    send: byChannel((channel) => t(`admin.notifications.test.send.${channel}`)),
    sending: t("admin.notifications.test.sending"),
    done: byChannel((channel) => t(`admin.notifications.test.done.${channel}`)),
    needsTelegram: t("admin.notifications.test.needsTelegram"),
    errors: {
      forbidden: t("admin.notifications.test.errors.forbidden"),
      unavailable: t("admin.notifications.test.errors.unavailable"),
      error: t("admin.notifications.test.errors.error"),
    },
  };
}
