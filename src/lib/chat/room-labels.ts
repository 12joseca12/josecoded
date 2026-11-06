import type { MessageKey } from "@/i18n/keys.generated";
import type {
  AiSwitchLabels,
  ConsentBadgeLabels,
  MemberListLabels,
  RoomLabels,
} from "@/types/room";

type Translate = (key: MessageKey) => string;

export function roomLabels(t: Translate): RoomLabels {
  return {
    threadLabel: t("room.threadLabel"),
    sourcesLabel: t("room.sourcesLabel"),
    empty: t("room.empty"),
    composerLabel: t("room.composer.label"),
    placeholder: t("room.composer.placeholder"),
    send: t("room.composer.send"),
    sending: t("room.composer.sending"),
    readOnly: t("room.composer.readOnly"),
    archived: t("room.composer.archived"),
    count: t("room.composer.count"),
    errors: {
      forbidden: t("room.errors.forbidden"),
      archived: t("room.errors.archived"),
      invalid: t("room.errors.invalid"),
      error: t("room.errors.error"),
      poll: t("room.errors.poll"),
      type: t("room.errors.type"),
      too_many: t("room.errors.too_many"),
      too_large: t("room.errors.too_large"),
      attachments_failed: t("room.errors.attachments_failed"),
    },
    attachments: {
      attach: t("room.attachments.attach"),
      hint: t("room.attachments.hint"),
      selected: t("room.attachments.selected"),
      remove: t("room.attachments.remove"),
      removeAria: t("room.attachments.removeAria"),
      progress: t("room.attachments.progress"),
      download: t("room.attachments.download"),
      sizeKb: t("room.attachments.sizeKb"),
      sizeMb: t("room.attachments.sizeMb"),
    },
    authors: {
      nexo: t("room.authors.nexo"),
      visitor: t("room.authors.visitor"),
      someone: t("room.authors.someone"),
      you: t("room.authors.you"),
    },
    auto: t("room.auto"),
    system: {
      member_added: t("room.system.member_added"),
      member_left: t("room.system.member_left"),
      ai_on: t("room.system.ai_on"),
      ai_off: t("room.system.ai_off"),
      ai_off_takeover: t("room.system.ai_off_takeover"),
      consent_granted: t("room.system.consent_granted"),
      consent_revoked: t("room.system.consent_revoked"),
      archived: t("room.system.archived"),
      handoff_done: t("room.system.handoff_done"),
    },
  };
}

export function memberListLabels(t: Translate): MemberListLabels {
  return {
    title: t("room.members.title"),
    empty: t("room.members.empty"),
    roles: {
      owner: t("room.members.roles.owner"),
      closer: t("room.members.roles.closer"),
      client: t("room.members.roles.client"),
      freelance: t("room.members.roles.freelance"),
    },
    remove: t("room.members.remove"),
    removeAria: t("room.members.removeAria"),
    confirmTitle: t("room.members.confirmTitle"),
    confirmText: t("room.members.confirmText"),
    confirmSubmit: t("room.members.confirmSubmit"),
    saving: t("room.members.saving"),
    close: t("room.members.close"),
    removed: t("room.members.removed"),
    add: t("room.members.add"),
    addSelect: t("room.members.addSelect"),
    addPlaceholder: t("room.members.addPlaceholder"),
    addButton: t("room.members.addButton"),
    adding: t("room.members.adding"),
    added: t("room.members.added"),
    errors: {
      error: t("room.members.errors.error"),
      forbidden: t("room.members.errors.forbidden"),
      already_member: t("room.members.errors.already_member"),
      client_outside_project: t("room.members.errors.client_outside_project"),
      role_mismatch: t("room.members.errors.role_mismatch"),
      invalid_member: t("room.members.errors.invalid_member"),
      owner_cannot_leave: t("room.members.errors.owner_cannot_leave"),
      member_not_found: t("room.members.errors.member_not_found"),
      conversation_archived: t("room.members.errors.conversation_archived"),
      visitor_room: t("room.members.errors.visitor_room"),
    },
  };
}

export function aiSwitchLabels(t: Translate): AiSwitchLabels {
  return {
    label: t("room.ai.label"),
    on: t("room.ai.on"),
    off: t("room.ai.off"),
    offTakeover: t("room.ai.offTakeover"),
    saving: t("room.ai.saving"),
    changed: t("room.ai.changed"),
    errors: {
      error: t("room.ai.errors.error"),
      forbidden: t("room.ai.errors.forbidden"),
      conversation_archived: t("room.ai.errors.conversation_archived"),
    },
  };
}

export function consentBadgeLabels(t: Translate): ConsentBadgeLabels {
  return {
    label: t("room.consent.label"),
    states: {
      granted: t("room.consent.granted"),
      revoked: t("room.consent.revoked"),
      pending: t("room.consent.pending"),
    },
  };
}
