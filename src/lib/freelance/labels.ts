import type { FreelanceStatementLabels } from "@/components/admin/StatementPrint/StatementPrint";
import type { PhaseBoardLabels } from "@/components/area/PhaseBoard/PhaseBoard";
import type { RecentUpdatesLabels } from "@/components/area/RecentUpdates/RecentUpdates";
import type { FeeHistoryLabels } from "@/components/freelance/FeeHistoryTable/FeeHistoryTable";
import type { FeeItemTableLabels } from "@/components/freelance/FeeItemTable/FeeItemTable";
import type { FreelanceTodoLabels } from "@/components/freelance/FreelanceTodo/FreelanceTodo";
import type { PayoutTableLabels } from "@/components/freelance/PayoutTable/PayoutTable";
import type { ProjectListLabels } from "@/components/freelance/ProjectList/ProjectList";
import type { TaskStatusMenuLabels } from "@/components/freelance/TaskStatusMenu/TaskStatusMenu";
import type { MessageKey } from "@/i18n/keys.generated";
import { fileListLabels, phaseNames, uploaderLabels } from "@/lib/area/labels";
import { type FeeCardLabels, feeErrorCodes, feeItemStatuses } from "@/types/freelance-fees";
import type { FileListLabels, UploaderLabels } from "@/types/project-documents";
import {
  type ProgressLogLabels,
  updateErrorCodes,
  type UpdateFormLabels,
} from "@/types/project-updates";

type T = (key: MessageKey) => string;

export function projectListLabels(t: T): ProjectListLabels {
  return {
    phase: t("freelance.projects.phase"),
    phases: {
      discover: t("area.phases.discover"),
      design: t("area.phases.design"),
      build: t("area.phases.build"),
      publish: t("area.phases.publish"),
      maintain: t("area.phases.maintain"),
    },
    status: {
      active: t("freelance.projects.status.active"),
      paused: t("freelance.projects.status.paused"),
      closed: t("freelance.projects.status.closed"),
    },
    progress: t("freelance.projects.progress"),
    noTasks: t("freelance.projects.noTasks"),
    tasksDone: t("freelance.projects.tasksDone"),
    due: t("freelance.projects.due"),
    closed: t("freelance.projects.closedPill"),
  };
}

export function boardLabels(t: T): PhaseBoardLabels {
  return {
    board: t("freelance.project.tasks.board"),
    phases: phaseNames(t),
    emptyPhase: t("freelance.project.tasks.emptyPhase"),
    row: {
      status: {
        todo: t("freelance.project.tasks.status.todo"),
        doing: t("freelance.project.tasks.status.doing"),
        done: t("freelance.project.tasks.status.done"),
      },
      mine: t("freelance.project.tasks.mine"),
      client: t("freelance.project.tasks.client"),
      fromStory: "",
    },
  };
}

export function statusMenuLabels(t: T): TaskStatusMenuLabels {
  return {
    group: t("freelance.project.tasks.menu.group"),
    statuses: {
      todo: t("freelance.project.tasks.status.todo"),
      doing: t("freelance.project.tasks.status.doing"),
      done: t("freelance.project.tasks.status.done"),
    },
    saving: t("freelance.project.tasks.menu.saving"),
    changed: t("freelance.project.tasks.menu.changed"),
    errors: {
      forbidden: t("freelance.project.tasks.menu.errors.forbidden"),
      stale: t("freelance.project.tasks.menu.errors.stale"),
      error: t("freelance.project.tasks.menu.errors.error"),
    },
  };
}

export function fileLabels(t: T): FileListLabels {
  return {
    ...fileListLabels(t),
    region: t("freelance.project.files.region"),
    empty: {
      title: t("freelance.project.files.empty.title"),
      text: t("freelance.project.files.empty.text"),
    },
  };
}

export function uploaderFreelanceLabels(t: T): UploaderLabels {
  return {
    ...uploaderLabels(t),
    title: t("freelance.project.files.uploader.title"),
    submit: t("freelance.project.files.uploader.submit"),
  };
}

export function progressLogLabels(t: T): ProgressLogLabels {
  const errors = {} as ProgressLogLabels["errors"];
  for (const code of updateErrorCodes) {
    errors[code] = t(`freelance.updates.errors.${code}` as MessageKey);
  }
  return {
    title: t("freelance.updates.title"),
    empty: t("freelance.updates.empty"),
    list: t("freelance.updates.list"),
    authors: { me: t("freelance.updates.authors.me"), jose: t("freelance.updates.authors.jose") },
    task: t("freelance.updates.task"),
    visibility: {
      internal: t("freelance.updates.visibility.internal"),
      client: t("freelance.updates.visibility.client"),
    },
    toggle: t("freelance.updates.toggle"),
    toggling: t("freelance.updates.toggling"),
    delete: t("freelance.updates.delete"),
    deleteFor: t("freelance.updates.deleteFor"),
    deleteConfirm: t("freelance.updates.deleteConfirm"),
    deleting: t("freelance.updates.deleting"),
    cancel: t("freelance.updates.cancel"),
    deleted: t("freelance.updates.deleted"),
    errors,
  };
}

export function updateFormLabels(t: T): UpdateFormLabels {
  const errors = {} as UpdateFormLabels["errors"];
  for (const code of [...updateErrorCodes, "body", "taskId"] as const) {
    errors[code] = t(`freelance.updates.form.errors.${code}` as MessageKey);
  }
  return {
    open: t("freelance.updates.form.open"),
    title: t("freelance.updates.form.title"),
    close: t("freelance.updates.form.close"),
    body: t("freelance.updates.form.body"),
    bodyHint: t("freelance.updates.form.bodyHint"),
    task: t("freelance.updates.form.task"),
    noTask: t("freelance.updates.form.noTask"),
    visible: t("freelance.updates.form.visible"),
    visibleHint: t("freelance.updates.form.visibleHint"),
    submit: t("freelance.updates.form.submit"),
    submitting: t("freelance.updates.form.submitting"),
    errors,
  };
}

export function recentLabels(t: T): RecentUpdatesLabels {
  return {
    title: t("freelance.home.recent.title"),
    empty: t("freelance.home.recent.empty"),
    task: t("area.home.recent.task"),
    document: t("area.home.recent.document"),
    fee: t("freelance.home.recent.fee"),
    update: {
      jose: t("freelance.home.recent.update.jose"),
      team: t("freelance.home.recent.update.team"),
    },
    story: {
      proposed: t("area.home.recent.story.proposed"),
      in_review: t("area.home.recent.story.in_review"),
      accepted: t("area.home.recent.story.accepted"),
      rejected: t("area.home.recent.story.rejected"),
      in_tasks: t("area.home.recent.story.in_tasks"),
    },
  };
}

export function feeCardLabels(t: T): FeeCardLabels {
  const errors = {} as FeeCardLabels["errors"];
  for (const code of [...feeErrorCodes, "hours", "label", "workedOn"] as const) {
    errors[code] = t(`freelance.fees.errors.${code}` as MessageKey);
  }
  const statuses = {} as FeeCardLabels["statuses"];
  for (const status of feeItemStatuses) {
    statuses[status] = t(`freelance.fees.statuses.${status}` as MessageKey);
  }
  return {
    title: t("freelance.fees.title"),
    modes: {
      hourly: t("freelance.fees.modes.hourly"),
      milestones: t("freelance.fees.modes.milestones"),
      fixed: t("freelance.fees.modes.fixed"),
    },
    hourly: t("freelance.fees.hourly"),
    hourlyCap: t("freelance.fees.hourlyCap"),
    fixed: t("freelance.fees.fixed"),
    milestones: t("freelance.fees.milestones"),
    owed: t("freelance.fees.owed"),
    none: t("freelance.fees.none"),
    itemsTitle: t("freelance.fees.itemsTitle"),
    noItems: t("freelance.fees.noItems"),
    statuses,
    hoursOf: t("freelance.fees.hoursOf"),
    rejectedReason: t("freelance.fees.rejectedReason"),
    deliver: t("freelance.fees.deliver"),
    delivering: t("freelance.fees.delivering"),
    delivered: t("freelance.fees.delivered"),
    deleteItem: t("freelance.fees.deleteItem"),
    deleteFor: t("freelance.fees.deleteFor"),
    deleting: t("freelance.fees.deleting"),
    deletedItem: t("freelance.fees.deletedItem"),
    closedNote: t("freelance.fees.closedNote"),
    errors,
    form: {
      title: t("freelance.fees.form.title"),
      hours: t("freelance.fees.form.hours"),
      hoursHint: t("freelance.fees.form.hoursHint"),
      label: t("freelance.fees.form.label"),
      labelHint: t("freelance.fees.form.labelHint"),
      date: t("freelance.fees.form.date"),
      submit: t("freelance.fees.form.submit"),
      submitting: t("freelance.fees.form.submitting"),
      done: t("freelance.fees.form.done"),
    },
  };
}

function itemStatuses(t: T): FeeItemTableLabels["statuses"] {
  const statuses = {} as FeeItemTableLabels["statuses"];
  for (const status of feeItemStatuses) {
    statuses[status] = t(`freelance.fees.statuses.${status}` as MessageKey);
  }
  return statuses;
}

export function itemTableLabels(t: T): FeeItemTableLabels {
  return {
    caption: t("freelance.pay.items.caption"),
    region: t("freelance.pay.items.region"),
    columns: {
      date: t("freelance.pay.items.columns.date"),
      project: t("freelance.pay.items.columns.project"),
      label: t("freelance.pay.items.columns.label"),
      hours: t("freelance.pay.items.columns.hours"),
      amount: t("freelance.pay.items.columns.amount"),
      state: t("freelance.pay.items.columns.state"),
    },
    statuses: itemStatuses(t),
    rejected: t("freelance.pay.items.rejected"),
    empty: t("freelance.pay.items.empty"),
  };
}

export function historyLabels(t: T): FeeHistoryLabels {
  return {
    caption: t("freelance.pay.history.caption"),
    region: t("freelance.pay.history.region"),
    columns: {
      project: t("freelance.pay.history.columns.project"),
      mode: t("freelance.pay.history.columns.mode"),
      agreed: t("freelance.pay.history.columns.agreed"),
      approved: t("freelance.pay.history.columns.approved"),
      paid: t("freelance.pay.history.columns.paid"),
      state: t("freelance.pay.history.columns.state"),
    },
    modes: {
      hourly: t("freelance.fees.modes.hourly"),
      milestones: t("freelance.fees.modes.milestones"),
      fixed: t("freelance.fees.modes.fixed"),
    },
    open: t("freelance.pay.history.open"),
    closed: t("freelance.pay.history.closed"),
    variable: t("freelance.pay.history.variable"),
  };
}

export function payoutTableLabels(t: T): PayoutTableLabels {
  return {
    caption: t("freelance.pay.payouts.caption"),
    region: t("freelance.pay.payouts.region"),
    columns: {
      period: t("freelance.pay.payouts.columns.period"),
      total: t("freelance.pay.payouts.columns.total"),
      withholding: t("freelance.pay.payouts.columns.withholding"),
      net: t("freelance.pay.payouts.columns.net"),
      state: t("freelance.pay.payouts.columns.state"),
      reference: t("freelance.pay.payouts.columns.reference"),
      statement: t("freelance.pay.payouts.columns.statement"),
    },
    range: t("freelance.pay.payouts.range"),
    statuses: {
      issued: t("freelance.pay.payouts.statuses.issued"),
      paid: t("freelance.pay.payouts.statuses.paid"),
    },
    open: t("freelance.pay.payouts.open"),
    openFor: t("freelance.pay.payouts.openFor"),
  };
}

export function statementLabels(
  t: T,
): FreelanceStatementLabels & { print: string; printHint: string } {
  return {
    title: t("freelance.pay.statement.title"),
    notInvoice: t("freelance.pay.statement.notInvoice"),
    beneficiary: t("freelance.pay.statement.beneficiary"),
    period: t("freelance.pay.statement.period"),
    range: t("freelance.pay.payouts.range"),
    status: t("freelance.pay.statement.status"),
    statuses: {
      issued: t("freelance.pay.payouts.statuses.issued"),
      paid: t("freelance.pay.payouts.statuses.paid"),
    },
    issuedAt: t("freelance.pay.statement.issuedAt"),
    paidAt: t("freelance.pay.statement.paidAt"),
    reference: t("freelance.pay.statement.reference"),
    note: t("freelance.pay.statement.note"),
    itemsTitle: t("freelance.pay.statement.itemsTitle"),
    total: t("freelance.pay.statement.total"),
    withholding: t("freelance.pay.statement.withholding"),
    net: t("freelance.pay.statement.net"),
    items: itemTableLabels(t),
    print: t("freelance.pay.statement.print"),
    printHint: t("freelance.pay.statement.printHint"),
  };
}

export function todoLabels(t: T): FreelanceTodoLabels {
  const errors = {} as FreelanceTodoLabels["errors"];
  for (const code of feeErrorCodes) {
    errors[code] = t(`freelance.fees.errors.${code}` as MessageKey);
  }
  return {
    title: t("freelance.home.todo.title"),
    empty: t("freelance.home.todo.empty"),
    tasksTitle: t("freelance.home.todo.tasksTitle"),
    milestonesTitle: t("freelance.home.todo.milestonesTitle"),
    deliver: t("freelance.home.todo.deliver"),
    delivering: t("freelance.home.todo.delivering"),
    delivered: t("freelance.home.todo.delivered"),
    errors,
  };
}
