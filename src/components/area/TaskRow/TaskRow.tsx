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
  storyHref: string;
  mine: boolean;
  labels: TaskRowLabels;
}

export function TaskRow({ task, href, storyHref, mine, labels }: TaskRowProps) {
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
