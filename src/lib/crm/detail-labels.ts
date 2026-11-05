import type {
  ActivityComposerLabels,
  ActivityTimelineLabels,
  ContactHeadLabels,
  DealCardLabels,
  ReassignLabels,
} from "@/types/crm-detail";

import {
  kindLabels,
  stageLabels,
  stageSheetLabels,
  type Translate,
  viaLabels,
} from "./contact-labels";

export function contactHeadLabels(t: Translate): ContactHeadLabels {
  return {
    kinds: kindLabels(t),
    sources: {
      manual: t("crm.contacts.sources.manual"),
      import: t("crm.contacts.sources.import"),
      form: t("crm.contacts.sources.form"),
      nexo: t("crm.contacts.sources.nexo"),
      whatsapp: t("crm.contacts.sources.whatsapp"),
      radar: t("crm.contacts.sources.radar"),
    },
    source: t("crm.contact.head.source"),
    email: t("crm.contact.head.email"),
    noEmail: t("crm.contact.head.noEmail"),
    copy: t("crm.contact.head.copy"),
    copyAria: t("crm.contact.head.copyAria"),
    copied: t("crm.contact.head.copied"),
    phone: t("crm.contact.head.phone"),
    call: t("crm.contacts.call"),
    whatsapp: t("crm.contacts.whatsapp"),
    callAria: t("crm.contacts.callAria"),
    whatsappAria: t("crm.contacts.whatsappAria"),
    city: t("crm.contact.head.city"),
    website: t("crm.contact.head.website"),
    owner: t("crm.contact.head.owner"),
    noOwner: t("crm.contact.head.noOwner"),
    unknownOwner: t("crm.contact.head.unknownOwner"),
    nextStep: t("crm.contact.head.nextStep"),
    noNextStep: t("crm.contact.head.noNextStep"),
    overdue: t("crm.contact.head.overdue"),
    lastContact: t("crm.contact.head.lastContact"),
    never: t("crm.contact.head.never"),
    tags: t("crm.contact.head.tags"),
    notes: t("crm.contact.head.notes"),
  };
}

export function reassignLabels(t: Translate): ReassignLabels {
  return {
    open: t("crm.contact.reassign.open"),
    title: t("crm.contact.reassign.title"),
    close: t("crm.contact.reassign.close"),
    owner: t("crm.contact.reassign.owner"),
    placeholder: t("crm.contact.reassign.placeholder"),
    note: t("crm.contact.reassign.note"),
    submit: t("crm.contact.reassign.submit"),
    saving: t("crm.contact.reassign.saving"),
    done: t("crm.contact.reassign.done"),
    errors: {
      owner: t("crm.contact.reassign.errors.owner"),
      forbidden: t("crm.contact.reassign.errors.forbidden"),
      error: t("crm.contact.reassign.errors.error"),
    },
  };
}

export function dealCardLabels(t: Translate): DealCardLabels {
  return {
    stages: stageLabels(t),
    vias: viaLabels(t),
    amount: t("crm.contact.deals.amount"),
    noAmount: t("crm.contact.deals.noAmount"),
    wonAmount: t("crm.contact.deals.wonAmount"),
    wonAt: t("crm.contact.deals.wonAt"),
    lostAt: t("crm.contact.deals.lostAt"),
    lostReason: t("crm.contact.deals.lostReason"),
    created: t("crm.contact.deals.created"),
    lose: t("crm.contact.deals.lose"),
    loseAria: t("crm.contact.deals.loseAria"),
    reopen: t("crm.contact.deals.reopen"),
    reopenAria: t("crm.contact.deals.reopenAria"),
    stageSheet: stageSheetLabels(t),
  };
}

export function activityTimelineLabels(t: Translate): ActivityTimelineLabels {
  return {
    title: t("crm.contact.activity.title"),
    listLabel: t("crm.contact.activity.listLabel"),
    emptyTitle: t("crm.contact.activity.emptyTitle"),
    emptyText: t("crm.contact.activity.emptyText"),
    system: t("crm.contact.activity.system"),
    unknownAuthor: t("crm.contact.activity.unknownAuthor"),
    kinds: {
      note: t("crm.contact.activity.kinds.note"),
      call: t("crm.contact.activity.kinds.call"),
      meeting: t("crm.contact.activity.kinds.meeting"),
      email: t("crm.contact.activity.kinds.email"),
      whatsapp: t("crm.contact.activity.kinds.whatsapp"),
      stage_change: t("crm.contact.activity.kinds.stage_change"),
      form: t("crm.contact.activity.kinds.form"),
      chat: t("crm.contact.activity.kinds.chat"),
      system: t("crm.contact.activity.kinds.system"),
    },
  };
}

export function activityComposerLabels(t: Translate): ActivityComposerLabels {
  return {
    title: t("crm.contact.composer.title"),
    kind: t("crm.contact.composer.kind"),
    kinds: {
      note: t("crm.contact.activity.kinds.note"),
      call: t("crm.contact.activity.kinds.call"),
      meeting: t("crm.contact.activity.kinds.meeting"),
      email: t("crm.contact.activity.kinds.email"),
      whatsapp: t("crm.contact.activity.kinds.whatsapp"),
    },
    deal: t("crm.contact.composer.deal"),
    noDeal: t("crm.contact.composer.noDeal"),
    body: t("crm.contact.composer.body"),
    submit: t("crm.contact.composer.submit"),
    saving: t("crm.contact.composer.saving"),
    done: t("crm.contact.composer.done"),
    errors: {
      kind: t("crm.contact.composer.errors.kind"),
      body: t("crm.contact.composer.errors.body"),
      dealId: t("crm.contact.composer.errors.dealId"),
      forbidden: t("crm.contact.composer.errors.forbidden"),
      error: t("crm.contact.composer.errors.error"),
    },
  };
}
