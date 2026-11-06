import type { MessageKey } from "@/i18n/keys.generated";
import {
  aiSwitchLabels,
  consentBadgeLabels,
  memberListLabels,
  roomLabels,
} from "@/lib/chat/room-labels";
import type {
  ChatPanelLabels,
  ChatTab,
  ConversationListLabels,
  CreateLeadLabels,
} from "@/types/admin-chat";

type Translate = (key: MessageKey) => string;

export function chatTabLabels(t: Translate): Record<ChatTab, string> {
  return {
    visitors: t("admin.chat.tabs.visitors"),
    people: t("admin.chat.tabs.people"),
    clients: t("admin.chat.tabs.clients"),
    archived: t("admin.chat.tabs.archived"),
  };
}

export function conversationListLabels(t: Translate): ConversationListLabels {
  return {
    kinds: {
      visitor: t("admin.chat.row.kinds.visitor"),
      closer: t("admin.chat.row.kinds.closer"),
      client: t("admin.chat.row.kinds.client"),
      freelance: t("admin.chat.row.kinds.freelance"),
    },
    visitor: t("admin.chat.row.visitor"),
    noMessages: t("admin.chat.row.noMessages"),
    unread: t("admin.chat.row.unread"),
    nexoOn: t("admin.chat.row.nexoOn"),
    nexoOff: t("admin.chat.row.nexoOff"),
    archived: t("admin.chat.row.archived"),
    consent: consentBadgeLabels(t),
  };
}

export function createLeadLabels(t: Translate): CreateLeadLabels {
  return {
    title: t("admin.chat.detail.lead.title"),
    none: t("admin.chat.detail.lead.none"),
    ready: t("admin.chat.detail.lead.ready"),
    button: t("admin.chat.detail.lead.button"),
    confirmTitle: t("admin.chat.detail.lead.confirmTitle"),
    confirmText: t("admin.chat.detail.lead.confirmText"),
    submit: t("admin.chat.detail.lead.submit"),
    saving: t("admin.chat.detail.lead.saving"),
    close: t("admin.chat.detail.lead.close"),
    done: t("admin.chat.detail.lead.done"),
    converted: t("admin.chat.detail.lead.converted"),
    openContact: t("admin.chat.detail.lead.openContact"),
    openLead: t("admin.chat.detail.lead.openLead"),
    errors: {
      error: t("admin.chat.detail.lead.errors.error"),
      forbidden: t("admin.chat.detail.lead.errors.forbidden"),
      lead_discarded: t("admin.chat.detail.lead.errors.lead_discarded"),
      lead_not_found: t("admin.chat.detail.lead.errors.lead_not_found"),
      contact_conflict: t("admin.chat.detail.lead.errors.contact_conflict"),
      invalid_assignee: t("admin.chat.detail.lead.errors.invalid_assignee"),
    },
  };
}

export function chatPanelLabels(t: Translate): ChatPanelLabels {
  return {
    archive: {
      trigger: t("admin.chat.detail.archive.trigger"),
      title: t("admin.chat.detail.archive.title"),
      text: t("admin.chat.detail.archive.text"),
      submit: t("admin.chat.detail.archive.submit"),
      saving: t("admin.chat.detail.archive.saving"),
      close: t("admin.chat.detail.archive.close"),
      done: t("admin.chat.detail.archive.done"),
      errors: {
        error: t("admin.chat.detail.archive.errors.error"),
        forbidden: t("admin.chat.detail.archive.errors.forbidden"),
        conversation_not_found: t("admin.chat.detail.archive.errors.conversation_not_found"),
      },
    },
    ai: aiSwitchLabels(t),
    consent: consentBadgeLabels(t),
    members: memberListLabels(t),
    room: roomLabels(t),
  };
}
