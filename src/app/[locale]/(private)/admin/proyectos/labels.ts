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
  type AddItemSheetLabels,
  type FeeErrorCode,
  feeErrorCodes,
  type FeeField,
  feeFields,
  feeItemStatuses,
  type FeeItemTableLabels,
  feeModes,
  type FeePanelLabels,
  type FeeSheetLabels,
  type FeeTotalsLabels,
} from "@/types/admin-project-fee";
import {
  decisionErrorCodes,
  decisionFields,
  type StoryDecisionLabels,
  storyDecisions,
  type StoryListLabels,
  storyStatuses,
} from "@/types/admin-project-stories";
import {
  type LinkEditorLabels,
  linkErrorCodes,
  linkFields,
  teamErrorCodes,
  type TeamPanelLabels,
} from "@/types/admin-project-team";
import {
  type UpdateErrorCode,
  updateErrorCodes,
  type UpdateField,
  updateFields,
  type UpdatesPanelLabels,
  updateVisibilities,
} from "@/types/admin-project-updates";
import {
  projectErrorCodes,
  projectFields,
  type ProjectPhase,
  projectPhases,
  type ProjectSheetLabels,
  projectStatuses,
  type ProjectTableLabels,
} from "@/types/admin-projects";
import {
  type DocumentErrorCode,
  documentErrorCodes,
  documentVisibilities,
  type FileListLabels,
  type UploaderLabels,
} from "@/types/project-documents";

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

function documentErrors(
  t: Translate,
  group: "files" | "uploader",
): Record<DocumentErrorCode, string> {
  const errors = {} as Record<DocumentErrorCode, string>;
  for (const code of documentErrorCodes) errors[code] = t(`${detail}.docs.${group}.errors.${code}`);
  return errors;
}

export function fileListLabels(t: Translate): FileListLabels {
  const f = `${detail}.docs.files` as const;
  const visibility = {} as FileListLabels["visibility"];
  for (const option of documentVisibilities) visibility[option] = t(`${f}.visibility.${option}`);
  return {
    region: t(`${f}.region`),
    empty: { title: t(`${f}.empty.title`), text: t(`${f}.empty.text`) },
    download: t(`${f}.download`),
    downloadFor: t(`${f}.downloadFor`),
    delete: t(`${f}.delete`),
    deleteFor: t(`${f}.deleteFor`),
    deleteConfirm: t(`${f}.deleteConfirm`),
    deleting: t(`${f}.deleting`),
    cancel: t(`${f}.cancel`),
    deleted: t(`${f}.deleted`),
    visibility,
    errors: documentErrors(t, "files"),
  };
}

export function uploaderLabels(t: Translate): UploaderLabels {
  const u = `${detail}.docs.uploader` as const;
  const visibilityOptions = {} as UploaderLabels["visibilityOptions"];
  for (const option of documentVisibilities) {
    visibilityOptions[option] = t(`${u}.visibilityOptions.${option}`);
  }
  return {
    title: t(`${u}.title`),
    file: t(`${u}.file`),
    fileHint: t(`${u}.fileHint`),
    visibility: t(`${u}.visibility`),
    visibilityOptions,
    submit: t(`${u}.submit`),
    submitting: t(`${u}.submitting`),
    progress: t(`${u}.progress`),
    done: t(`${u}.done`),
    errors: documentErrors(t, "uploader"),
  };
}

export function linkEditorLabels(t: Translate): LinkEditorLabels {
  const l = `${detail}.links` as const;
  const errors = {} as LinkEditorLabels["errors"];
  for (const key of [...linkFields, ...linkErrorCodes]) errors[key] = t(`${l}.errors.${key}`);
  return {
    region: t(`${l}.region`),
    title: t(`${l}.title`),
    intro: t(`${l}.intro`),
    empty: t(`${l}.empty`),
    add: t(`${l}.add`),
    edit: t(`${l}.edit`),
    editFor: t(`${l}.editFor`),
    cancel: t(`${l}.cancel`),
    delete: t(`${l}.delete`),
    deleteFor: t(`${l}.deleteFor`),
    deleteConfirm: t(`${l}.deleteConfirm`),
    deleting: t(`${l}.deleting`),
    up: t(`${l}.up`),
    down: t(`${l}.down`),
    moved: t(`${l}.moved`),
    deleted: t(`${l}.deleted`),
    saved: t(`${l}.saved`),
    limit: t(`${l}.limit`),
    openNewTab: t(`${l}.openNewTab`),
    form: {
      name: t(`${l}.form.name`),
      url: t(`${l}.form.url`),
      urlHint: t(`${l}.form.urlHint`),
      usage: t(`${l}.form.usage`),
      usageHint: t(`${l}.form.usageHint`),
      optional: t(`${l}.form.optional`),
      submitAdd: t(`${l}.form.submitAdd`),
      submitEdit: t(`${l}.form.submitEdit`),
      submitting: t(`${l}.form.submitting`),
    },
    errors,
  };
}

export function teamPanelLabels(t: Translate): TeamPanelLabels {
  const m = `${detail}.team` as const;
  const errors = {} as TeamPanelLabels["errors"];
  for (const code of teamErrorCodes) errors[code] = t(`${m}.errors.${code}`);
  return {
    title: t(`${m}.title`),
    client: {
      title: t(`${m}.client.title`),
      none: t(`${m}.client.none`),
      noneHelp: t(`${m}.client.noneHelp`),
      assign: t(`${m}.client.assign`),
      assignPlaceholder: t(`${m}.client.assignPlaceholder`),
      assignSubmit: t(`${m}.client.assignSubmit`),
      assigning: t(`${m}.client.assigning`),
      assigned: t(`${m}.client.assigned`),
      noCandidates: t(`${m}.client.noCandidates`),
      room: t(`${m}.client.room`),
    },
    freelance: {
      title: t(`${m}.freelance.title`),
      none: t(`${m}.freelance.none`),
      field: t(`${m}.freelance.field`),
      submit: t(`${m}.freelance.submit`),
      submitting: t(`${m}.freelance.submitting`),
      saved: t(`${m}.freelance.saved`),
    },
    errors,
  };
}

const team = "admin.projects.team" as const;
const fee = `${team}.fee` as const;

function feeErrors(t: Translate): Record<FeeField | FeeErrorCode, string> {
  const errors = {} as Record<FeeField | FeeErrorCode, string>;
  for (const key of [...feeFields, ...feeErrorCodes]) errors[key] = t(`${fee}.errors.${key}`);
  return errors;
}

export function feePanelLabels(t: Translate): FeePanelLabels {
  const errors = feeErrors(t);
  const modes = {} as FeeSheetLabels["modes"];
  const summary = {} as FeePanelLabels["summary"];
  for (const mode of feeModes) {
    modes[mode] = t(`${fee}.sheet.modes.${mode}`);
    summary[mode] = t(`${fee}.summary.${mode}`);
  }
  const statuses = {} as FeeItemTableLabels["statuses"];
  for (const status of feeItemStatuses) statuses[status] = t(`${fee}.table.statuses.${status}`);
  const sheet: FeeSheetLabels = {
    open: t(`${fee}.sheet.open`),
    openEdit: t(`${fee}.sheet.openEdit`),
    title: t(`${fee}.sheet.title`),
    close: t(`${fee}.sheet.close`),
    mode: t(`${fee}.sheet.mode`),
    modes,
    amount: t(`${fee}.sheet.amount`),
    amountHint: t(`${fee}.sheet.amountHint`),
    hourlyRate: t(`${fee}.sheet.hourlyRate`),
    hoursCap: t(`${fee}.sheet.hoursCap`),
    hoursCapHint: t(`${fee}.sheet.hoursCapHint`),
    note: t(`${fee}.sheet.note`),
    optional: t(`${fee}.sheet.optional`),
    modeLocked: t(`${fee}.sheet.modeLocked`),
    fixedItemLabel: t(`${fee}.sheet.fixedItemLabel`),
    submit: t(`${fee}.sheet.submit`),
    submitting: t(`${fee}.sheet.submitting`),
    done: t(`${fee}.sheet.done`),
    errors,
  };
  const add: AddItemSheetLabels = {
    open: t(`${fee}.add.open`),
    title: t(`${fee}.add.title`),
    close: t(`${fee}.add.close`),
    label: t(`${fee}.add.label`),
    amount: t(`${fee}.add.amount`),
    remaining: t(`${fee}.add.remaining`),
    workedOn: t(`${fee}.add.workedOn`),
    optional: t(`${fee}.add.optional`),
    submit: t(`${fee}.add.submit`),
    submitting: t(`${fee}.add.submitting`),
    done: t(`${fee}.add.done`),
    errors,
  };
  const table: FeeItemTableLabels = {
    caption: t(`${fee}.table.caption`),
    region: t(`${fee}.table.region`),
    empty: t(`${fee}.table.empty`),
    select: t(`${fee}.table.select`),
    columns: {
      select: t(`${fee}.table.columns.select`),
      label: t(`${fee}.table.columns.label`),
      hours: t(`${fee}.table.columns.hours`),
      amount: t(`${fee}.table.columns.amount`),
      date: t(`${fee}.table.columns.date`),
      by: t(`${fee}.table.columns.by`),
      status: t(`${fee}.table.columns.status`),
      actions: t(`${fee}.table.columns.actions`),
    },
    statuses,
    by: { freelance: t(`${fee}.table.by.freelance`), jose: t(`${fee}.table.by.jose`) },
    approve: t(`${fee}.table.approve`),
    approving: t(`${fee}.table.approving`),
    approved: t(`${fee}.table.approved`),
    rejectOpen: t(`${fee}.table.rejectOpen`),
    rejectOpenFor: t(`${fee}.table.rejectOpenFor`),
    rejectTitle: t(`${fee}.table.rejectTitle`),
    rejectReason: t(`${fee}.table.rejectReason`),
    rejectSubmit: t(`${fee}.table.rejectSubmit`),
    rejecting: t(`${fee}.table.rejecting`),
    rejected: t(`${fee}.table.rejected`),
    rejectedReason: t(`${fee}.table.rejectedReason`),
    delete: t(`${fee}.table.delete`),
    deleteFor: t(`${fee}.table.deleteFor`),
    deleted: t(`${fee}.table.deleted`),
    close: t(`${fee}.table.close`),
    errors,
  };
  const totals: FeeTotalsLabels = {
    region: t(`${fee}.totals.region`),
    agreed: t(`${fee}.totals.agreed`),
    pending: t(`${fee}.totals.pending`),
    delivered: t(`${fee}.totals.delivered`),
    approved: t(`${fee}.totals.approved`),
    paid: t(`${fee}.totals.paid`),
    none: t(`${fee}.totals.none`),
  };
  return {
    title: t(`${fee}.title`),
    noFreelance: t(`${fee}.noFreelance`),
    noFee: t(`${fee}.noFee`),
    error: { title: t(`${fee}.error.title`), text: t(`${fee}.error.text`) },
    summary,
    summaryCap: t(`${fee}.summaryCap`),
    settle: t(`${fee}.settle`),
    sheet,
    add,
    table,
    totals,
  };
}

const updates = "admin.projects.updates" as const;

export function updatesPanelLabels(t: Translate): UpdatesPanelLabels {
  const codeErrors = {} as Record<UpdateErrorCode, string>;
  for (const code of updateErrorCodes) codeErrors[code] = t(`${updates}.errors.${code}`);
  const formErrors = {} as Record<UpdateField | UpdateErrorCode, string>;
  for (const field of updateFields) formErrors[field] = t(`${updates}.form.errors.${field}`);
  Object.assign(formErrors, codeErrors);
  const visibility = {} as UpdatesPanelLabels["visibility"];
  for (const value of updateVisibilities) visibility[value] = t(`${updates}.visibility.${value}`);
  return {
    title: t(`${updates}.title`),
    empty: t(`${updates}.empty`),
    authorJose: t(`${updates}.authorJose`),
    authorFreelance: t(`${updates}.authorFreelance`),
    task: t(`${updates}.task`),
    visibility,
    publish: t(`${updates}.publish`),
    publishing: t(`${updates}.publishing`),
    hide: t(`${updates}.hide`),
    hiding: t(`${updates}.hiding`),
    published: t(`${updates}.published`),
    hidden: t(`${updates}.hidden`),
    delete: t(`${updates}.delete`),
    deleteFor: t(`${updates}.deleteFor`),
    deleteTitle: t(`${updates}.deleteTitle`),
    deleteText: t(`${updates}.deleteText`),
    deleteSubmit: t(`${updates}.deleteSubmit`),
    deleting: t(`${updates}.deleting`),
    deleted: t(`${updates}.deleted`),
    close: t(`${updates}.close`),
    form: {
      title: t(`${updates}.form.title`),
      body: t(`${updates}.form.body`),
      task: t(`${updates}.form.task`),
      taskNone: t(`${updates}.form.taskNone`),
      visible: t(`${updates}.form.visible`),
      visibleHint: t(`${updates}.form.visibleHint`),
      optional: t(`${updates}.form.optional`),
      submit: t(`${updates}.form.submit`),
      submitting: t(`${updates}.form.submitting`),
      done: t(`${updates}.form.done`),
      errors: formErrors,
    },
    errors: codeErrors,
  };
}
