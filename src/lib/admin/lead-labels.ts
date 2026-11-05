import type { MessageKey } from "@/i18n/keys.generated";
import {
  dealStages,
  type LeadActionLabels,
  type LeadDetailLabels,
  leadSources,
  leadStatuses,
  type LeadTab,
  type LeadTableLabels,
  leadTabs,
  leadVias,
  manualLeadSources,
  type NewLeadField,
  type NewLeadLabels,
} from "@/types/leads";

export type Translate = (key: MessageKey) => string;

const key = (path: string) => `admin.leads.${path}` as MessageKey;

function record<T extends string>(t: Translate, prefix: string, names: readonly T[]) {
  return Object.fromEntries(names.map((name) => [name, t(key(`${prefix}.${name}`))])) as Record<
    T,
    string
  >;
}

export function leadActionLabels(t: Translate): LeadActionLabels {
  return {
    assignLabel: t(key("actions.assignLabel")),
    assignPlaceholder: t(key("actions.assignPlaceholder")),
    assign: t(key("actions.assign")),
    assigning: t(key("actions.assigning")),
    noAssignees: t(key("actions.noAssignees")),
    discardOpen: t(key("actions.discardOpen")),
    discardReasonLabel: t(key("actions.discardReasonLabel")),
    discardSubmit: t(key("actions.discardSubmit")),
    discarding: t(key("actions.discarding")),
    reasonPrefix: t(key("actions.reasonPrefix")),
    done: {
      assign: t(key("actions.done.assign")),
      discard: t(key("actions.done.discard")),
    },
    errors: {
      assignee: t(key("actions.errors.assignee")),
      reason: t(key("actions.errors.reason")),
      stale: t(key("actions.errors.stale")),
      forbidden: t(key("actions.errors.forbidden")),
      error: t(key("actions.errors.error")),
    },
  };
}

export function leadTableLabels(t: Translate): LeadTableLabels {
  return {
    region: t(key("region")),
    caption: t(key("caption")),
    columns: {
      via: t(key("columns.via")),
      name: t(key("columns.name")),
      email: t(key("columns.email")),
      organization: t(key("columns.organization")),
      source: t(key("columns.source")),
      status: t(key("columns.status")),
      assigned: t(key("columns.assigned")),
      date: t(key("columns.date")),
      actions: t(key("columns.actions")),
    },
    via: {
      ...record(t, "via", leadVias),
      none: t(key("via.none")),
    },
    status: record(t, "status", leadStatuses),
    sources: record(t, "source", leadSources),
    noEmail: t(key("noEmail")),
    noOrganization: t(key("noOrganization")),
    unassigned: t(key("unassigned")),
    unknownAssignee: t(key("unknownAssignee")),
    actions: leadActionLabels(t),
  };
}

function group<T extends string>(t: Translate, prefix: string, names: readonly T[]) {
  return record(t, prefix, names);
}

export function leadDetailLabels(t: Translate): LeadDetailLabels {
  return {
    message: group(t, "detail.message", ["title", "empty"]),
    contact: group(t, "detail.contact", ["title", "email", "phone", "organization", "none"]),
    origin: {
      ...group(t, "detail.origin", [
        "title",
        "source",
        "via",
        "created",
        "page",
        "locale",
        "consent",
        "consentYes",
        "consentNo",
      ]),
      locales: group(t, "detail.origin.locales", ["es", "en"]),
    },
    offer: group(t, "detail.offer", [
      "title",
      "offer",
      "extras",
      "answers",
      "company",
      "offerUrl",
      "wantedBy",
      "hasDomain",
      "hasStoreAccounts",
      "yes",
      "no",
    ]),
    owner: group(t, "detail.owner", [
      "title",
      "status",
      "assignedTo",
      "assignedBy",
      "assignedAt",
      "automatic",
      "waiting",
      "contact",
      "contactLink",
      "deal",
      "dealNone",
    ]),
    stage: group(t, "detail.stage", dealStages),
    table: leadTableLabels(t),
  };
}

export function leadTabLabels(t: Translate): Record<LeadTab, string> {
  return record(t, "tabs", leadTabs);
}

export function newLeadLabels(t: Translate): NewLeadLabels {
  const fields: NewLeadField[] = [
    "fullName",
    "email",
    "phone",
    "organization",
    "message",
    "assignedTo",
  ];
  return {
    open: t(key("new.open")),
    title: t(key("new.title")),
    close: t(key("new.close")),
    source: t(key("new.source")),
    sources: record(t, "new.sources", manualLeadSources),
    via: t(key("new.via")),
    viaNone: t(key("new.viaNone")),
    vias: record(t, "via", leadVias),
    fullName: t(key("new.fullName")),
    email: t(key("new.email")),
    phone: t(key("new.phone")),
    organization: t(key("new.organization")),
    message: t(key("new.message")),
    assignedTo: t(key("new.assignedTo")),
    assignedNone: t(key("new.assignedNone")),
    optional: t(key("new.optional")),
    submit: t(key("new.submit")),
    submitting: t(key("new.submitting")),
    done: t(key("new.done")),
    detail: t(key("new.detail")),
    errors: {
      ...(Object.fromEntries(fields.map((name) => [name, t(key(`new.errors.${name}`))])) as Record<
        NewLeadField,
        string
      >),
      reachable: t(key("new.errors.reachable")),
      forbidden: t(key("new.errors.forbidden")),
      error: t(key("new.errors.error")),
    },
  };
}
