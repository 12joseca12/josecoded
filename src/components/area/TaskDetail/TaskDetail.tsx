import type { ReactNode } from "react";

import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import type { TaskDetailRow } from "@/types/area";

import styles from "./TaskDetail.module.css";

export interface TaskDetailLabels {
  back: string;
  phase: string;
  status: string;
  statuses: Record<TaskDetailRow["status"], string>;
  assignedToYou: string;
  assignedToTeam: string;
  doneOn: string;
  description: string;
  noDescription: string;
  fromStory: string;
}

interface TaskDetailProps {
  task: TaskDetailRow;
  phaseName: string;
  backHref: string;
  storyHref: string | null;
  doneDate: string | null;
  mine: boolean;
  labels: TaskDetailLabels;
  action: ReactNode;
}

export function TaskDetail({
  task,
  phaseName,
  backHref,
  storyHref,
  doneDate,
  mine,
  labels,
  action,
}: TaskDetailProps) {
  return (
    <article className={styles.detail}>
      <Link href={backHref} variant="inline">
        {labels.back}
      </Link>
      <Heading level={1} size="h2">
        {task.title}
      </Heading>
      <ul className={styles.facts}>
        <li>
          <span className={styles.label}>{labels.phase}</span> <strong>{phaseName}</strong>
        </li>
        <li>
          <span className={styles.label}>{labels.status}</span>{" "}
          <strong>{labels.statuses[task.status]}</strong>
        </li>
        {mine ? <li>{labels.assignedToYou}</li> : null}
        {task.assignee_kind === "team" ? <li>{labels.assignedToTeam}</li> : null}
        {doneDate ? <li>{labels.doneOn.replace("{date}", doneDate)}</li> : null}
        {task.story && storyHref ? (
          <li>
            {labels.fromStory.split("{title}")[0]}
            <Link href={storyHref}>{task.story.title}</Link>
            {labels.fromStory.split("{title}")[1]}
          </li>
        ) : null}
      </ul>
      <section className={styles.description} aria-labelledby="task-description">
        <Heading level={2} size="h4" id="task-description">
          {labels.description}
        </Heading>
        <p className={task.description ? styles.text : styles.empty}>
          {task.description ?? labels.noDescription}
        </p>
      </section>
      {action}
    </article>
  );
}
