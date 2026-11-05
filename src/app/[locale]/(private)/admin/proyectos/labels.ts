import type { MessageKey } from "@/i18n/keys.generated";
import {
  projectErrorCodes,
  projectFields,
  projectPhases,
  type ProjectSheetLabels,
  projectStatuses,
  type ProjectTableLabels,
} from "@/types/admin-projects";

type Translate = (key: MessageKey) => string;

const sheet = "admin.projects.sheet" as const;

export function projectSheetLabels(t: Translate): ProjectSheetLabels {
  const errors = {} as ProjectSheetLabels["errors"];
  for (const key of [...projectFields, ...projectErrorCodes]) {
    errors[key] = t(`${sheet}.errors.${key}`);
  }
  return {
    create: t(`${sheet}.create`),
    edit: t(`${sheet}.edit`),
    editFor: t(`${sheet}.editFor`),
    createTitle: t(`${sheet}.createTitle`),
    editTitle: t(`${sheet}.editTitle`),
    close: t(`${sheet}.close`),
    name: t(`${sheet}.name`),
    deal: t(`${sheet}.deal`),
    dealHint: t(`${sheet}.dealHint`),
    dealNone: t(`${sheet}.dealNone`),
    offer: t(`${sheet}.offer`),
    offerNone: t(`${sheet}.offerNone`),
    freelance: t(`${sheet}.freelance`),
    freelanceNone: t(`${sheet}.freelanceNone`),
    startedAt: t(`${sheet}.startedAt`),
    dueAt: t(`${sheet}.dueAt`),
    brief: t(`${sheet}.brief`),
    briefHint: t(`${sheet}.briefHint`),
    optional: t(`${sheet}.optional`),
    submitCreate: t(`${sheet}.submitCreate`),
    submitEdit: t(`${sheet}.submitEdit`),
    submitting: t(`${sheet}.submitting`),
    doneCreate: t(`${sheet}.doneCreate`),
    doneEdit: t(`${sheet}.doneEdit`),
    errors,
  };
}

export function projectTableLabels(t: Translate): ProjectTableLabels {
  const table = "admin.projects.table" as const;
  const phases = {} as ProjectTableLabels["phases"];
  for (const phase of projectPhases) phases[phase] = t(`admin.projects.phases.${phase}`);
  const statuses = {} as ProjectTableLabels["statuses"];
  for (const status of projectStatuses) statuses[status] = t(`admin.projects.statuses.${status}`);
  return {
    region: t(`${table}.region`),
    caption: t(`${table}.caption`),
    columns: {
      name: t(`${table}.columns.name`),
      phase: t(`${table}.columns.phase`),
      progress: t(`${table}.columns.progress`),
      stories: t(`${table}.columns.stories`),
      freelance: t(`${table}.columns.freelance`),
      dates: t(`${table}.columns.dates`),
      actions: t(`${table}.columns.actions`),
    },
    phases,
    statuses,
    noClient: t(`${table}.noClient`),
    none: t(`${table}.none`),
    progress: t(`${table}.progress`),
    progressText: t(`${table}.progressText`),
    storiesToDecide: t(`${table}.storiesToDecide`),
  };
}
