import type { ProjectListLabels } from "@/components/freelance/ProjectList/ProjectList";
import type { MessageKey } from "@/i18n/keys.generated";

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
