import type { Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import type { ChatLabels, ChatStarterTopic } from "@/types/chat";
import { nexoStates } from "@/types/nexo";

import { withResponseTime } from "../common/response-time";

type Translate = (key: MessageKey) => string;

const starterKeys = ["s1", "s2", "s3"] as const;

function starters(t: Translate, topic: ChatStarterTopic): string[] {
  return starterKeys.map((key) => t(`chat.starters.${topic}.${key}`));
}

export function buildChatLabels(t: Translate, locale: Locale): ChatLabels {
  const timed = (key: MessageKey) => withResponseTime(t, t(key));
  return {
    title: t("chat.title"),
    close: t("chat.close"),
    fullscreen: t("chat.fullscreen"),
    fullscreenHref: `/${locale}/chat`,
    nexoName: t("chat.nexo.name"),
    subtitleOnline: t("chat.header.online"),
    subtitleOffline: t("chat.header.offline"),
    subtitleTakeover: t("chat.header.takeover"),
    greeting: t("chat.greeting"),
    logLabel: t("chat.log"),
    you: t("chat.author.you"),
    jose: t("chat.author.jose"),
    sourcesLabel: t("chat.sources"),
    sending: t("chat.delivery.sending"),
    failed: t("chat.delivery.failed"),
    typing: t("chat.typing"),
    composerLabel: t("chat.composer.label"),
    composerPlaceholder: t("chat.composer.placeholder"),
    send: t("chat.composer.send"),
    sendingMessage: t("chat.composer.sending"),
    remaining: t("chat.composer.remaining"),
    startersLabel: t("chat.starters.label"),
    starters: {
      default: starters(t, "default"),
      services: starters(t, "services"),
      freelance: starters(t, "freelance"),
      about: starters(t, "about"),
      contact: starters(t, "contact"),
    },
    systemEvents: {
      ai_off: t("chat.system.ai_off"),
      ai_on: t("chat.system.ai_on"),
      handoff_done: t("chat.system.handoff_done"),
      archived: t("chat.system.archived"),
    },
    notices: {
      takeover: { title: t("chat.notice.takeover.title"), text: t("chat.notice.takeover.text") },
      offline: { title: t("chat.notice.offline.title"), text: timed("chat.notice.offline.text") },
      quota: { title: t("chat.notice.quota.title"), text: timed("chat.notice.quota.text") },
    },
    quotaAction: { label: t("chat.notice.quotaAction"), href: `/${locale}/contacto#formulario` },
    sendErrors: {
      burst: t("chat.errors.burst"),
      quota: t("chat.errors.quota"),
      closed: t("chat.errors.closed"),
      verification: t("chat.errors.verification"),
      invalid: t("chat.errors.invalid"),
      unavailable: t("chat.errors.unavailable"),
    },
    handoff: {
      title: t("chat.handoff.title"),
      lead: timed("chat.handoff.lead"),
      nameLabel: t("chat.handoff.name"),
      emailLabel: t("chat.handoff.email"),
      phoneLabel: t("chat.handoff.phone"),
      contactHint: t("chat.handoff.contactHint"),
      optional: t("chat.handoff.optional"),
      consentBefore: t("chat.handoff.consentBefore"),
      consentLink: t("chat.handoff.consentLink"),
      consentAfter: t("chat.handoff.consentAfter"),
      privacyHref: `/${locale}/legal/privacidad`,
      newTab: t("chat.handoff.newTab"),
      submit: t("chat.handoff.submit"),
      submitting: t("chat.handoff.submitting"),
      doneTitle: t("chat.handoff.doneTitle"),
      doneText: timed("chat.handoff.doneText"),
      failed: t("chat.handoff.failed"),
      errors: {
        contact_required: t("chat.handoff.errors.contact_required"),
        email_invalid: t("chat.handoff.errors.email_invalid"),
        phone_invalid: t("chat.handoff.errors.phone_invalid"),
        name_invalid: t("chat.handoff.errors.name_invalid"),
        consent_required: t("chat.handoff.errors.consent_required"),
      },
    },
    avatar: {
      offline: t("chat.avatarOffline"),
      states: Object.fromEntries(
        nexoStates.map((state) => [state, t(`chat.nexo.label.${state}`)]),
      ) as ChatLabels["avatar"]["states"],
    },
  };
}
