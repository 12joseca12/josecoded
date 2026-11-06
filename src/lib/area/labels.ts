import type { CompleteTaskLabels } from "@/components/area/CompleteTask/CompleteTask";
import type { NexoConsentLabels } from "@/components/area/NexoConsentCard/NexoConsentCard";
import type { PhaseBoardLabels } from "@/components/area/PhaseBoard/PhaseBoard";
import type { PhaseStepsLabels } from "@/components/area/PhaseSteps/PhaseSteps";
import type { ProjectHeaderLabels } from "@/components/area/ProjectHeader/ProjectHeader";
import type { ProjectLinksLabels } from "@/components/area/ProjectLinks/ProjectLinks";
import type { RecentUpdatesLabels } from "@/components/area/RecentUpdates/RecentUpdates";
import type { StoryActionsLabels } from "@/components/area/StoryActions/StoryActions";
import type { StoryCardLabels } from "@/components/area/StoryCard/StoryCard";
import type { StoryFormLabels } from "@/components/area/StoryForm/StoryForm";
import type { StoryListLabels } from "@/components/area/StoryList/StoryList";
import type { TaskDetailLabels } from "@/components/area/TaskDetail/TaskDetail";
import type { TodoLabels } from "@/components/area/TodoForYou/TodoForYou";
import type { MessageKey } from "@/i18n/keys.generated";
import type { StoryStatus } from "@/types/area";
import {
  type DocumentErrorCode,
  documentErrorCodes,
  type FileListLabels,
  type UploaderLabels,
} from "@/types/project-documents";

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

function storyStatusLabels(t: T): Record<StoryStatus, string> {
  return {
    proposed: t("area.stories.status.proposed"),
    in_review: t("area.stories.status.in_review"),
    accepted: t("area.stories.status.accepted"),
    rejected: t("area.stories.status.rejected"),
    in_tasks: t("area.stories.status.in_tasks"),
  };
}

export function storyListLabels(t: T): StoryListLabels {
  return {
    list: t("area.stories.list"),
    status: storyStatusLabels(t),
    created: t("area.stories.created"),
    estimate: t("area.stories.estimate"),
  };
}

export function storyCardLabels(t: T): StoryCardLabels {
  return {
    back: t("area.stories.detail.back"),
    status: storyStatusLabels(t),
    asA: t("area.stories.detail.asA"),
    iWant: t("area.stories.detail.iWant"),
    soThat: t("area.stories.detail.soThat"),
    criteria: t("area.stories.detail.criteria"),
    noCriteria: t("area.stories.detail.noCriteria"),
    verdict: t("area.stories.detail.verdict"),
    hours: t("area.stories.detail.hours"),
    amount: t("area.stories.detail.amount"),
    note: t("area.stories.detail.note"),
    decidedOn: t("area.stories.detail.decidedOn"),
    task: t("area.stories.detail.task"),
    reviewHint: t("area.stories.detail.reviewHint"),
    rejectedHint: t("area.stories.detail.rejectedHint"),
    pendingHint: t("area.stories.detail.pendingHint"),
  };
}

export function storyActionsLabels(t: T): StoryActionsLabels {
  return {
    edit: t("area.stories.detail.edit"),
    remove: t("area.stories.detail.remove"),
    removeAsk: t("area.stories.detail.removeAsk"),
    removeYes: t("area.stories.detail.removeYes"),
    removeNo: t("area.stories.detail.removeNo"),
    removing: t("area.stories.detail.removing"),
    confirm: t("area.stories.detail.confirm"),
    confirming: t("area.stories.detail.confirming"),
    decline: t("area.stories.detail.decline"),
    declining: t("area.stories.detail.declining"),
    doneConfirm: t("area.stories.detail.doneConfirm"),
    doneDecline: t("area.stories.detail.doneDecline"),
    errors: {
      forbidden: t("area.stories.detail.errors.forbidden"),
      stale: t("area.stories.detail.errors.stale"),
      error: t("area.stories.detail.errors.error"),
    },
  };
}

export function storyFormLabels(t: T, mode: "create" | "edit"): StoryFormLabels {
  return {
    title: t("area.stories.form.title"),
    titleHint: t("area.stories.form.titleHint"),
    asA: t("area.stories.form.asA"),
    asAHint: t("area.stories.form.asAHint"),
    iWant: t("area.stories.form.iWant"),
    soThat: t("area.stories.form.soThat"),
    criteria: t("area.stories.form.criteria"),
    criteriaHint: t("area.stories.form.criteriaHint"),
    criterion: t("area.stories.form.criterion"),
    addCriterion: t("area.stories.form.addCriterion"),
    removeCriterion: t("area.stories.form.removeCriterion"),
    submit: t(mode === "create" ? "area.stories.form.submit" : "area.stories.form.save"),
    submitting: t(mode === "create" ? "area.stories.form.submitting" : "area.stories.form.saving"),
    cancel: t("area.stories.form.cancel"),
    errors: {
      title: t("area.stories.form.errors.title"),
      asA: t("area.stories.form.errors.asA"),
      iWant: t("area.stories.form.errors.iWant"),
      soThat: t("area.stories.form.errors.soThat"),
      criteria: t("area.stories.form.errors.criteria"),
      forbidden: t("area.stories.form.errors.forbidden"),
      stale: t("area.stories.form.errors.stale"),
      error: t("area.stories.form.errors.error"),
    },
  };
}

export function consentLabels(t: T): NexoConsentLabels {
  return {
    title: t("area.chat.consent.title"),
    text: t("area.chat.consent.text"),
    state: {
      granted: t("area.chat.consent.state.granted"),
      revoked: t("area.chat.consent.state.revoked"),
      pending: t("area.chat.consent.state.pending"),
    },
    grant: t("area.chat.consent.grant"),
    revoke: t("area.chat.consent.revoke"),
    saving: t("area.chat.consent.saving"),
    done: {
      granted: t("area.chat.consent.done.granted"),
      revoked: t("area.chat.consent.done.revoked"),
    },
    errors: {
      forbidden: t("area.chat.consent.errors.forbidden"),
      error: t("area.chat.consent.errors.error"),
    },
  };
}

function documentErrors(t: T, group: "files" | "uploader"): Record<DocumentErrorCode, string> {
  const errors = {} as Record<DocumentErrorCode, string>;
  for (const code of documentErrorCodes) {
    errors[code] = t(`area.docs.${group}.errors.${code}` as MessageKey);
  }
  return errors;
}

export function fileListLabels(t: T): FileListLabels {
  return {
    region: t("area.docs.files.region"),
    empty: { title: t("area.docs.files.empty.title"), text: t("area.docs.files.empty.text") },
    download: t("area.docs.files.download"),
    downloadFor: t("area.docs.files.downloadFor"),
    delete: t("area.docs.files.delete"),
    deleteFor: t("area.docs.files.deleteFor"),
    deleteConfirm: t("area.docs.files.deleteConfirm"),
    deleting: t("area.docs.files.deleting"),
    cancel: t("area.docs.files.cancel"),
    deleted: t("area.docs.files.deleted"),
    visibility: {
      client: t("area.docs.files.visibility.client"),
      team: t("area.docs.files.visibility.team"),
    },
    errors: documentErrors(t, "files"),
  };
}

export function uploaderLabels(t: T): UploaderLabels {
  return {
    title: t("area.docs.uploader.title"),
    file: t("area.docs.uploader.file"),
    fileHint: t("area.docs.uploader.fileHint"),
    visibility: t("area.docs.uploader.visibility"),
    visibilityOptions: {
      client: t("area.docs.uploader.visibilityOptions.client"),
      team: t("area.docs.uploader.visibilityOptions.team"),
    },
    submit: t("area.docs.uploader.submit"),
    submitting: t("area.docs.uploader.submitting"),
    progress: t("area.docs.uploader.progress"),
    done: t("area.docs.uploader.done"),
    errors: documentErrors(t, "uploader"),
  };
}
