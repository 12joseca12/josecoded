import type { CompleteTaskLabels } from "@/components/area/CompleteTask/CompleteTask";
import type { PhaseBoardLabels } from "@/components/area/PhaseBoard/PhaseBoard";
import type { PhaseStepsLabels } from "@/components/area/PhaseSteps/PhaseSteps";
import type { ProjectHeaderLabels } from "@/components/area/ProjectHeader/ProjectHeader";
import type { ProjectLinksLabels } from "@/components/area/ProjectLinks/ProjectLinks";
import type { RecentUpdatesLabels } from "@/components/area/RecentUpdates/RecentUpdates";
import type { TaskDetailLabels } from "@/components/area/TaskDetail/TaskDetail";
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

export function boardLabels(t: T): PhaseBoardLabels {
  return {
    board: t("area.tasks.board"),
    phases: phaseNames(t),
    emptyPhase: t("area.tasks.emptyPhase"),
    row: {
      status: {
        todo: t("area.tasks.status.todo"),
        doing: t("area.tasks.status.doing"),
        done: t("area.tasks.status.done"),
      },
      mine: t("area.tasks.mine"),
      fromStory: t("area.tasks.fromStory"),
    },
  };
}

export function taskDetailLabels(t: T): TaskDetailLabels {
  return {
    back: t("area.tasks.detail.back"),
    phase: t("area.tasks.detail.phase"),
    status: t("area.tasks.detail.status"),
    statuses: {
      todo: t("area.tasks.status.todo"),
      doing: t("area.tasks.status.doing"),
      done: t("area.tasks.status.done"),
    },
    assignedToYou: t("area.tasks.detail.assignedToYou"),
    doneOn: t("area.tasks.detail.doneOn"),
    description: t("area.tasks.detail.description"),
    noDescription: t("area.tasks.detail.noDescription"),
    fromStory: t("area.tasks.detail.fromStory"),
  };
}

export function completeTaskLabels(t: T): CompleteTaskLabels {
  return {
    complete: t("area.tasks.detail.complete"),
    completing: t("area.tasks.detail.completing"),
    done: t("area.tasks.detail.done"),
    errors: {
      forbidden: t("area.tasks.detail.errors.forbidden"),
      stale: t("area.tasks.detail.errors.stale"),
      error: t("area.tasks.detail.errors.error"),
    },
  };
}
