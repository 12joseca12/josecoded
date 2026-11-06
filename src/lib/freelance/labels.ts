import type { PhaseBoardLabels } from "@/components/area/PhaseBoard/PhaseBoard";
import type { ProjectListLabels } from "@/components/freelance/ProjectList/ProjectList";
import type { TaskStatusMenuLabels } from "@/components/freelance/TaskStatusMenu/TaskStatusMenu";
import type { MessageKey } from "@/i18n/keys.generated";
import { fileListLabels, phaseNames, uploaderLabels } from "@/lib/area/labels";
import type { FileListLabels, UploaderLabels } from "@/types/project-documents";

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
