import type { MessageKey } from "@/i18n/keys.generated";
import type {
  ContactFilterLabels,
  ContactKind,
  ContactTableLabels,
  DealStage,
  NewContactLabels,
  ReachableStage,
  StageSheetLabels,
} from "@/types/crm";

export type Translate = (key: MessageKey) => string;

export function kindLabels(t: Translate): Record<ContactKind, string> {
  return {
    prospect: t("crm.contacts.kinds.prospect"),
    client: t("crm.contacts.kinds.client"),
    recruiter: t("crm.contacts.kinds.recruiter"),
    partner: t("crm.contacts.kinds.partner"),
    other: t("crm.contacts.kinds.other"),
  };
}

export function stageLabels(t: Translate): Record<DealStage, string> {
  return {
    new: t("crm.contacts.stages.new"),
    contacted: t("crm.contacts.stages.contacted"),
    meeting: t("crm.contacts.stages.meeting"),
    proposal: t("crm.contacts.stages.proposal"),
    won: t("crm.contacts.stages.won"),
    lost: t("crm.contacts.stages.lost"),
  };
}

export function viaLabels(t: Translate): ContactTableLabels["vias"] {
  return {
    hiring: t("crm.contacts.vias.hiring"),
    freelance: t("crm.contacts.vias.freelance"),
    project: t("crm.contacts.vias.project"),
  };
}

export function stageSheetLabels(t: Translate): StageSheetLabels {
  const stages = stageLabels(t);
  const reachable: Record<ReachableStage, string> = {
    new: stages.new,
    contacted: stages.contacted,
    meeting: stages.meeting,
    proposal: stages.proposal,
    lost: stages.lost,
  };
  return {
    open: t("crm.contacts.stageSheet.open"),
    openAria: t("crm.contacts.stageSheet.openAria"),
    title: t("crm.contacts.stageSheet.title"),
    close: t("crm.contacts.stageSheet.close"),
    stageLegend: t("crm.contacts.stageSheet.stageLegend"),
    stages: reachable,
    reasonLabel: t("crm.contacts.stageSheet.reasonLabel"),
    submit: t("crm.contacts.stageSheet.submit"),
    saving: t("crm.contacts.stageSheet.saving"),
    done: t("crm.contacts.stageSheet.done"),
    errors: {
      stage: t("crm.contacts.stageSheet.errors.stage"),
      reason: t("crm.contacts.stageSheet.errors.reason"),
      stale: t("crm.contacts.stageSheet.errors.stale"),
      forbidden: t("crm.contacts.stageSheet.errors.forbidden"),
      error: t("crm.contacts.stageSheet.errors.error"),
    },
  };
}

export function contactTableLabels(t: Translate): ContactTableLabels {
  return {
    region: t("crm.contacts.region"),
    caption: t("crm.contacts.caption"),
    listLabel: t("crm.contacts.listLabel"),
    columns: {
      name: t("crm.contacts.columns.name"),
      organization: t("crm.contacts.columns.organization"),
      kind: t("crm.contacts.columns.kind"),
      stage: t("crm.contacts.columns.stage"),
      nextAction: t("crm.contacts.columns.nextAction"),
      lastContact: t("crm.contacts.columns.lastContact"),
      source: t("crm.contacts.columns.source"),
      owner: t("crm.contacts.columns.owner"),
    },
    kinds: kindLabels(t),
    sources: {
      manual: t("crm.contacts.sources.manual"),
      import: t("crm.contacts.sources.import"),
      form: t("crm.contacts.sources.form"),
      nexo: t("crm.contacts.sources.nexo"),
      whatsapp: t("crm.contacts.sources.whatsapp"),
      radar: t("crm.contacts.sources.radar"),
    },
    stages: stageLabels(t),
    vias: viaLabels(t),
    noDeal: t("crm.contacts.noDeal"),
    noNextAction: t("crm.contacts.noNextAction"),
    overdue: t("crm.contacts.overdue"),
    never: t("crm.contacts.never"),
    noOwner: t("crm.contacts.noOwner"),
    unknownOwner: t("crm.contacts.unknownOwner"),
    noEmail: t("crm.contacts.noEmail"),
    call: t("crm.contacts.call"),
    whatsapp: t("crm.contacts.whatsapp"),
    callAria: t("crm.contacts.callAria"),
    whatsappAria: t("crm.contacts.whatsappAria"),
    stageSheet: stageSheetLabels(t),
  };
}

export function contactFilterLabels(t: Translate): ContactFilterLabels {
  return {
    region: t("crm.contacts.filters.region"),
    search: t("crm.contacts.filters.search"),
    searchPlaceholder: t("crm.contacts.filters.searchPlaceholder"),
    kind: t("crm.contacts.filters.kind"),
    stage: t("crm.contacts.filters.stage"),
    owner: t("crm.contacts.filters.owner"),
    all: t("crm.contacts.filters.all"),
    noOwner: t("crm.contacts.filters.noOwner"),
    due: t("crm.contacts.filters.due"),
    apply: t("crm.contacts.filters.apply"),
    clear: t("crm.contacts.filters.clear"),
    kinds: kindLabels(t),
    stages: stageLabels(t),
  };
}

export function newContactLabels(t: Translate): NewContactLabels {
  return {
    open: t("crm.contacts.new.open"),
    title: t("crm.contacts.new.title"),
    close: t("crm.contacts.new.close"),
    fullName: t("crm.contacts.new.fullName"),
    email: t("crm.contacts.new.email"),
    phone: t("crm.contacts.new.phone"),
    organization: t("crm.contacts.new.organization"),
    kind: t("crm.contacts.new.kind"),
    optional: t("crm.contacts.new.optional"),
    kinds: kindLabels(t),
    submit: t("crm.contacts.new.submit"),
    saving: t("crm.contacts.new.saving"),
    done: t("crm.contacts.new.done"),
    errors: {
      fullName: t("crm.contacts.new.errors.fullName"),
      email: t("crm.contacts.new.errors.email"),
      phone: t("crm.contacts.new.errors.phone"),
      organization: t("crm.contacts.new.errors.organization"),
      kind: t("crm.contacts.new.errors.kind"),
      duplicate: t("crm.contacts.new.errors.duplicate"),
      forbidden: t("crm.contacts.new.errors.forbidden"),
      error: t("crm.contacts.new.errors.error"),
    },
  };
}
