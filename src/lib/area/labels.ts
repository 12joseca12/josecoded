import type { PhaseStepsLabels } from "@/components/area/PhaseSteps/PhaseSteps";
import type { ProjectHeaderLabels } from "@/components/area/ProjectHeader/ProjectHeader";
import type { ProjectLinksLabels } from "@/components/area/ProjectLinks/ProjectLinks";
import type { RecentUpdatesLabels } from "@/components/area/RecentUpdates/RecentUpdates";
import type { TodoLabels } from "@/components/area/TodoForYou/TodoForYou";
import type { MessageKey } from "@/i18n/keys.generated";

type T = (key: MessageKey) => string;

export function phaseNames(t: T): PhaseStepsLabels["phases"] {
  return {
    discover: t("area.phases.discover"),
    design: t("area.phases.design"),
    build: t("area.phases.build"),
    publish: t("area.phases.publish"),
    maintain: t("area.phases.maintain"),
  };
}

export function phaseStepsLabels(t: T): PhaseStepsLabels {
  return {
    list: t("area.home.steps.list"),
    phases: phaseNames(t),
    state: {
      done: t("area.home.steps.done"),
      current: t("area.home.steps.current"),
      next: t("area.home.steps.next"),
    },
  };
}

export function headerLabels(t: T): ProjectHeaderLabels {
  return {
    phase: t("area.home.header.phase"),
    progress: t("area.home.header.progress"),
    noTasks: t("area.home.header.noTasks"),
  };
}

export function todoLabels(t: T): TodoLabels {
  return {
    title: t("area.home.todo.title"),
    empty: t("area.home.todo.empty"),
    tasksTitle: t("area.home.todo.tasksTitle"),
    storiesTitle: t("area.home.todo.storiesTitle"),
    complete: t("area.home.todo.complete"),
    completing: t("area.home.todo.completing"),
    confirm: t("area.home.todo.confirm"),
    confirming: t("area.home.todo.confirming"),
    decline: t("area.home.todo.decline"),
    declining: t("area.home.todo.declining"),
    estimate: t("area.home.todo.estimate"),
    note: t("area.home.todo.note"),
    phases: phaseNames(t),
    errors: {
      forbidden: t("area.home.todo.errors.forbidden"),
      stale: t("area.home.todo.errors.stale"),
      error: t("area.home.todo.errors.error"),
    },
    done: {
      task: t("area.home.todo.done.task"),
      confirm: t("area.home.todo.done.confirm"),
      decline: t("area.home.todo.done.decline"),
    },
  };
}

export function linksLabels(t: T): ProjectLinksLabels {
  return { title: t("area.home.links.title"), newTab: t("area.home.links.newTab") };
}

export function recentLabels(t: T): RecentUpdatesLabels {
  return {
    title: t("area.home.recent.title"),
    empty: t("area.home.recent.empty"),
    task: t("area.home.recent.task"),
    document: t("area.home.recent.document"),
    story: {
      proposed: t("area.home.recent.story.proposed"),
      in_review: t("area.home.recent.story.in_review"),
      accepted: t("area.home.recent.story.accepted"),
      rejected: t("area.home.recent.story.rejected"),
      in_tasks: t("area.home.recent.story.in_tasks"),
    },
  };
}
