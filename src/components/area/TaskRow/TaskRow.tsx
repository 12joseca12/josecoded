import NextLink from "next/link";

import type { BoardTask } from "@/types/area";

import styles from "./TaskRow.module.css";

export interface TaskRowLabels {
  status: Record<BoardTask["status"], string>;
  mine: string;
  fromStory: string;
}

interface TaskRowProps {
  task: BoardTask;
  href: string;
  mine: boolean;
  labels: TaskRowLabels;
}

export function TaskRow({ task, href, mine, labels }: TaskRowProps) {
  return (
    <li className={styles.row} data-status={task.status}>
      <NextLink href={href} className={styles.title}>
        {task.title}
      </NextLink>
      <p className={styles.meta}>
        <span className={styles.status}>{labels.status[task.status]}</span>
        {mine ? <span className={styles.mine}>{labels.mine}</span> : null}
      </p>
      {task.story ? (
        <p className={styles.story}>{labels.fromStory.replace("{title}", task.story.title)}</p>
      ) : null}
    </li>
  );
}
