import type { MessageKey } from "@/i18n/keys.generated";
import {
  type PhaseBoardLabels,
  type ProjectHeadLabels,
  type TaskErrorCode,
  taskErrorCodes,
  taskFields,
  type TaskSheetLabels,
  type TaskStatus,
  taskStatuses,
} from "@/types/admin-project-detail";
import {
  decisionErrorCodes,
  decisionFields,
  type StoryDecisionLabels,
  storyDecisions,
  type StoryListLabels,
  storyStatuses,
} from "@/types/admin-project-stories";
import {
  projectErrorCodes,
  projectFields,
  type ProjectPhase,
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

const detail = "admin.projects.detail" as const;

export function projectHeadLabels(t: Translate): ProjectHeadLabels {
  const phases = {} as ProjectHeadLabels["phases"];
  for (const phase of projectPhases) phases[phase] = t(`${detail}.head.phases.${phase}`);
  return {
    phase: t(`${detail}.head.phase`),
    phaseSaved: t(`${detail}.head.phaseSaved`),
    statuses: {
      active: t(`${detail}.head.statuses.active`),
      paused: t(`${detail}.head.statuses.paused`),
      closed: t(`${detail}.head.statuses.closed`),
    },
    archive: t(`${detail}.head.archive`),
    archiveConfirm: t(`${detail}.head.archiveConfirm`),
    restore: t(`${detail}.head.restore`),
    working: t(`${detail}.head.working`),
    cancel: t(`${detail}.head.cancel`),
    archived: t(`${detail}.head.archived`),
    restored: t(`${detail}.head.restored`),
    progress: t(`${detail}.head.progress`),
    progressText: t(`${detail}.head.progressText`),
    phases,
    errors: taskErrors(t),
  };
}

function taskErrors(t: Translate): Record<TaskErrorCode, string> {
  const errors = {} as Record<TaskErrorCode, string>;
  for (const code of taskErrorCodes) errors[code] = t(`${detail}.tasks.sheet.errors.${code}`);
  return errors;
}

function taskStatusLabels(t: Translate): Record<TaskStatus, string> {
  const statuses = {} as Record<TaskStatus, string>;
  for (const status of taskStatuses)
    statuses[status] = t(`${detail}.tasks.sheet.statuses.${status}`);
  return statuses;
}

function phaseLabels(t: Translate): Record<ProjectPhase, string> {
  const phases = {} as Record<ProjectPhase, string>;
  for (const phase of projectPhases) phases[phase] = t(`${detail}.head.phases.${phase}`);
  return phases;
}

export function phaseBoardLabels(t: Translate): PhaseBoardLabels {
  const board = `${detail}.tasks.board` as const;
  return {
    region: t(`${board}.region`),
    empty: t(`${board}.empty`),
    assignedTo: t(`${board}.assignedTo`),
    unassigned: t(`${board}.unassigned`),
    moveTo: t(`${board}.moveTo`),
    moveToFor: t(`${board}.moveToFor`),
    up: t(`${board}.up`),
    down: t(`${board}.down`),
    moving: t(`${board}.moving`),
    moved: t(`${board}.moved`),
    statuses: taskStatusLabels(t),
    phases: phaseLabels(t),
    errors: taskErrors(t),
  };
}

export function taskSheetLabels(t: Translate): TaskSheetLabels {
  const s = `${detail}.tasks.sheet` as const;
  const errors = { ...taskErrors(t) } as TaskSheetLabels["errors"];
  for (const field of taskFields) errors[field] = t(`${s}.errors.${field}`);
  return {
    create: t(`${s}.create`),
    createTitle: t(`${s}.createTitle`),
    editTitle: t(`${s}.editTitle`),
    edit: t(`${s}.edit`),
    editFor: t(`${s}.editFor`),
    close: t(`${s}.close`),
    title: t(`${s}.title`),
    description: t(`${s}.description`),
    optional: t(`${s}.optional`),
    phase: t(`${s}.phase`),
    status: t(`${s}.status`),
    assignee: t(`${s}.assignee`),
    assigneeNone: t(`${s}.assigneeNone`),
    submitCreate: t(`${s}.submitCreate`),
    submitEdit: t(`${s}.submitEdit`),
    submitting: t(`${s}.submitting`),
    done: t(`${s}.done`),
    delete: t(`${s}.delete`),
    deleteConfirm: t(`${s}.deleteConfirm`),
    deleting: t(`${s}.deleting`),
    cancel: t(`${s}.cancel`),
    statuses: taskStatusLabels(t),
    phases: phaseLabels(t),
    errors,
  };
}

export function storyListLabels(t: Translate): StoryListLabels {
  const s = `${detail}.stories` as const;
  const statuses = {} as StoryListLabels["statuses"];
  for (const status of storyStatuses) statuses[status] = t(`${s}.statuses.${status}`);
  return {
    empty: { title: t(`${s}.empty.title`), text: t(`${s}.empty.text`) },
    groups: {
      proposed: t(`${s}.groups.proposed`),
      in_review: t(`${s}.groups.in_review`),
      decided: t(`${s}.groups.decided`),
    },
    asA: t(`${s}.asA`),
    iWant: t(`${s}.iWant`),
    soThat: t(`${s}.soThat`),
    criteria: t(`${s}.criteria`),
    statuses,
    outOfScope: t(`${s}.outOfScope`),
    estimate: t(`${s}.estimate`),
    note: t(`${s}.note`),
    decidedOn: t(`${s}.decidedOn`),
    confirmedOn: t(`${s}.confirmedOn`),
    awaiting: t(`${s}.awaiting`),
    hasTask: t(`${s}.hasTask`),
  };
}

export function storyDecisionLabels(t: Translate): StoryDecisionLabels {
  const s = `${detail}.stories.decide` as const;
  const decisions = {} as StoryDecisionLabels["decisions"];
  for (const decision of storyDecisions) decisions[decision] = t(`${s}.decisions.${decision}`);
  const done = {} as StoryDecisionLabels["done"];
  for (const status of storyStatuses) done[status] = t(`${s}.done.${status}`);
  const errors = {} as StoryDecisionLabels["errors"];
  for (const key of [...decisionFields, ...decisionErrorCodes])
    errors[key] = t(`${s}.errors.${key}`);
  return {
    open: t(`${s}.open`),
    openFor: t(`${s}.openFor`),
    title: t(`${s}.title`),
    close: t(`${s}.close`),
    decision: t(`${s}.decision`),
    decisions,
    hours: t(`${s}.hours`),
    amount: t(`${s}.amount`),
    amountHint: t(`${s}.amountHint`),
    note: t(`${s}.note`),
    noteHint: t(`${s}.noteHint`),
    optional: t(`${s}.optional`),
    createTask: t(`${s}.createTask`),
    submit: t(`${s}.submit`),
    submitting: t(`${s}.submitting`),
    done,
    errors,
  };
}
