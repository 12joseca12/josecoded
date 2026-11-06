import NextLink from "next/link";
import type { ReactNode } from "react";

import type { BoardTask } from "@/types/area";

import styles from "./TaskRow.module.css";

export interface TaskRowLabels {
  status: Record<BoardTask["status"], string>;
  mine: string;
  team?: string;
  client?: string;
  fromStory: string;
}

interface TaskRowProps {
  task: BoardTask;
  href: string | null;
  storyHref: string;
  mine: boolean;
  labels: TaskRowLabels;
  statusControl?: ReactNode;
}

export function TaskRow({ task, href, storyHref, mine, labels, statusControl }: TaskRowProps) {
  return (
    <li className={styles.row} data-status={task.status}>
      {href === null ? (
        <p className={styles.title}>{task.title}</p>
      ) : (
        <NextLink href={href} className={styles.title}>
          {task.title}
        </NextLink>
      )}
      {statusControl}
      <p className={styles.meta}>
        {statusControl ? null : <span className={styles.status}>{labels.status[task.status]}</span>}
        {mine ? <span className={styles.mine}>{labels.mine}</span> : null}
        {task.assignee_kind === "team" && labels.team ? (
          <span className={styles.team}>{labels.team}</span>
        ) : null}
        {task.assignee_kind === "client" && labels.client ? (
          <span className={styles.team}>{labels.client}</span>
        ) : null}
      </p>
      {task.story ? (
        <p className={styles.story}>
          {labels.fromStory.split("{title}")[0]}
          <NextLink href={storyHref} className={styles.storyLink}>
            {task.story.title}
          </NextLink>
          {labels.fromStory.split("{title}")[1]}
        </p>
      ) : null}
    </li>
  );
}
