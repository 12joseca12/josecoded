"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { type TaskStatus, taskStatuses, type TodoActionResult } from "@/types/area";

import styles from "./TaskStatusMenu.module.css";

export interface TaskStatusMenuLabels {
  group: string;
  statuses: Record<TaskStatus, string>;
  saving: string;
  changed: string;
  errors: { forbidden: string; stale: string; error: string };
}

interface TaskStatusMenuProps {
  taskId: string;
  title: string;
  status: TaskStatus;
  change: (id: string, status: TaskStatus) => Promise<TodoActionResult>;
  labels: TaskStatusMenuLabels;
}

export function TaskStatusMenu({ taskId, title, status, change, labels }: TaskStatusMenuProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<keyof TaskStatusMenuLabels["errors"] | null>(null);

  const select = (next: TaskStatus) => {
    if (pending || next === status) return;
    setError(null);
    setTarget(next);
    startTransition(async () => {
      let result: TodoActionResult;
      try {
        result = await change(taskId, next);
      } catch {
        result = { status: "error" };
      }
      setTarget(null);
      if (result.status === "done") {
        announce(
          labels.changed.replace("{title}", title).replace("{status}", labels.statuses[next]),
        );
        router.refresh();
        return;
      }
      setError(result.status);
      if (result.status === "forbidden" || result.status === "stale") router.refresh();
    });
  };

  return (
    <div className={styles.menu}>
      <div
        className={styles.group}
        role="group"
        aria-label={labels.group.replace("{title}", title)}
        aria-busy={pending || undefined}
      >
        {taskStatuses.map((option) => (
          <button
            key={option}
            type="button"
            className={styles.option}
            aria-pressed={option === status}
            data-saving={target === option || undefined}
            disabled={pending}
            onClick={() => {
              select(option);
            }}
          >
            {target === option ? labels.saving : labels.statuses[option]}
          </button>
        ))}
      </div>
      <p className={styles.feedback} role="alert">
        {error === null ? null : labels.errors[error]}
      </p>
    </div>
  );
}
