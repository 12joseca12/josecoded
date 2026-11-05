import type { MessageKey } from "@/i18n/keys.generated";
import type { InvitationLabels } from "@/types/invitation";

type Translate = (key: MessageKey) => string;

export function buildInvitationLabels(t: Translate): InvitationLabels {
  return {
    title: t("invitation.title"),
    lead: t("invitation.lead"),
    leadAnonymous: t("invitation.leadAnonymous"),
    roles: {
      admin: t("invitation.roles.admin"),
      closer: t("invitation.roles.closer"),
      freelance: t("invitation.roles.freelance"),
      client: t("invitation.roles.client"),
    },
    expires: t("invitation.expires"),
    enter: t("invitation.enter"),
    enterHint: t("invitation.enterHint"),
    acceptTitle: t("invitation.acceptTitle"),
    nameLabel: t("invitation.nameLabel"),
    nameHint: t("invitation.nameHint"),
    localeLabel: t("invitation.localeLabel"),
    locales: { es: t("invitation.locales.es"), en: t("invitation.locales.en") },
    accept: t("invitation.accept"),
    accepting: t("invitation.accepting"),
    errors: {
      name: t("invitation.errors.name"),
      gone: t("invitation.errors.gone"),
      expired: t("invitation.errors.expired"),
      used: t("invitation.errors.used"),
      mismatch: t("invitation.errors.mismatch"),
      exists: t("invitation.errors.exists"),
      error: t("invitation.errors.error"),
    },
    gone: {
      unknown: {
        title: t("invitation.gone.unknown.title"),
        text: t("invitation.gone.unknown.text"),
      },
      revoked: {
        title: t("invitation.gone.revoked.title"),
        text: t("invitation.gone.revoked.text"),
      },
      expired: {
        title: t("invitation.gone.expired.title"),
        text: t("invitation.gone.expired.text"),
      },
      used: { title: t("invitation.gone.used.title"), text: t("invitation.gone.used.text") },
    },
    goneAction: t("invitation.goneAction"),
    mismatch: {
      title: t("invitation.mismatch.title"),
      text: t("invitation.mismatch.text"),
      action: t("invitation.mismatch.action"),
      acting: t("invitation.mismatch.acting"),
    },
  };
}
