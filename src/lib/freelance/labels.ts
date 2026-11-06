import type { PhaseBoardLabels } from "@/components/area/PhaseBoard/PhaseBoard";
import type { RecentUpdatesLabels } from "@/components/area/RecentUpdates/RecentUpdates";
import type { ProjectListLabels } from "@/components/freelance/ProjectList/ProjectList";
import type { TaskStatusMenuLabels } from "@/components/freelance/TaskStatusMenu/TaskStatusMenu";
import type { MessageKey } from "@/i18n/keys.generated";
import { fileListLabels, phaseNames, uploaderLabels } from "@/lib/area/labels";
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
