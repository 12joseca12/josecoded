import type { MessageKey } from "@/i18n/keys.generated";
import type { InboxLabels, OwnLeadsLabels } from "@/types/inbox";
import { leadStatuses, type leadVias } from "@/types/leads";

type Translate = (key: MessageKey) => string;

const key = (path: string) => `crm.leads.${path}` as MessageKey;

export function inboxLabels(t: Translate): InboxLabels {
  return {
    listLabel: t(key("inbox.listLabel")),
    claim: t(key("inbox.claim")),
    claiming: t(key("inbox.claiming")),
    claimAria: t(key("inbox.claimAria")),
    extras: t(key("inbox.extras")),
    noMessage: t(key("inbox.noMessage")),
    notices: {
      done: t(key("inbox.notices.done")),
      handoff: t(key("inbox.notices.handoff")),
      stale: t(key("inbox.notices.stale")),
      quota: t(key("inbox.notices.quota")),
      forbidden: t(key("inbox.notices.forbidden")),
      error: t(key("inbox.notices.error")),
    },
  };
}

export function viaLabels(t: Translate): Record<(typeof leadVias)[number] | "none", string> {
  return {
    hiring: t(key("vias.hiring")),
    freelance: t(key("vias.freelance")),
    project: t(key("vias.project")),
    none: t(key("vias.none")),
  };
}

export function localeLabels(t: Translate): Record<"es" | "en", string> {
  return { es: t(key("locales.es")), en: t(key("locales.en")) };
}

export function ownLeadsLabels(t: Translate, scope: "mine" | "team"): OwnLeadsLabels {
  return {
    listLabel: t(key(scope === "mine" ? "own.mineListLabel" : "own.teamListLabel")),
    statuses: Object.fromEntries(
      leadStatuses.map((status) => [status, t(key(`statuses.${status}`))]),
    ) as OwnLeadsLabels["statuses"],
    vias: viaLabels(t),
    noContact: t(key("own.noContact")),
    openContact: t(key("own.openContact")),
    openContactAria: t(key("own.openContactAria")),
    assignedTo: t(key("own.assignedTo")),
    noEmail: t(key("own.noEmail")),
  };
}
