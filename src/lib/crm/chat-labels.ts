import type { MessageKey } from "@/i18n/keys.generated";
import { consentBadgeLabels, memberListLabels, roomLabels } from "@/lib/chat/room-labels";
import type { CrmChatLabels } from "@/types/crm-chat";

type Translate = (key: MessageKey) => string;

export function crmChatLabels(t: Translate): CrmChatLabels {
  return {
    room: roomLabels(t),
    members: memberListLabels(t),
    consent: consentBadgeLabels(t),
    picker: {
      label: t("crm.chat.groups.label"),
      jose: t("crm.chat.groups.jose"),
      clients: t("crm.chat.groups.clients"),
      emptyClients: t("crm.chat.groups.emptyClients"),
      joseRoom: t("crm.chat.room.jose"),
      clientRoom: t("crm.chat.room.client"),
      current: t("crm.chat.room.current"),
      unread: t("crm.chat.room.unread"),
      noMessages: t("crm.chat.room.noMessages"),
    },
  };
}
