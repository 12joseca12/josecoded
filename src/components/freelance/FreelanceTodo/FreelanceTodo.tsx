"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import type { FeeErrorCode, FeeResult, ItemHandler } from "@/types/freelance-fees";

import styles from "./FreelanceTodo.module.css";

export interface TodoTask {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
}

export interface TodoMilestone {
  id: string;
  label: string;
  projectId: string;
  projectName: string;
}

export interface FreelanceTodoLabels {
  title: string;
  empty: string;
  tasksTitle: string;
  milestonesTitle: string;
  deliver: string;
  delivering: string;
  delivered: string;
  errors: Record<FeeErrorCode, string>;
}

interface FreelanceTodoProps {
  tasks: TodoTask[];
  milestones: TodoMilestone[];
  projectBase: string;
  deliver: ItemHandler;
  labels: FreelanceTodoLabels;
}

export function FreelanceTodo({
  tasks,
  milestones,
  projectBase,
  deliver,
  labels,
}: FreelanceTodoProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<FeeErrorCode | null>(null);

  const run = (id: string) => {
    if (pending) return;
    setError(null);
    setBusy(id);
    startTransition(async () => {
      let result: FeeResult;
      try {
        result = await deliver(id);
      } catch {
        result = { status: "error", code: "error" };
      }
      setBusy(null);
      if (result.status === "done") announce(labels.delivered);
      else setError(result.status === "error" ? result.code : "error");
      router.refresh();
    });
  };

  return (
    <section className={styles.section} aria-labelledby="freelance-todo">
      <Heading level={2} size="h4" id="freelance-todo">
        {labels.title}
      </Heading>
      {tasks.length === 0 && milestones.length === 0 ? (
        <p className={styles.empty}>{labels.empty}</p>
      ) : null}
      {tasks.length > 0 ? (
        <div className={styles.group}>
          <h3 className={styles.sub}>{labels.tasksTitle}</h3>
          <ul className={styles.list}>
            {tasks.map((task) => (
              <li key={task.id} className={styles.item}>
                <NextLink className={styles.name} href={`${projectBase}/${task.projectId}`}>
                  {task.title}
                </NextLink>
                <span className={styles.project}>{task.projectName}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {milestones.length > 0 ? (
        <div className={styles.group}>
          <h3 className={styles.sub}>{labels.milestonesTitle}</h3>
          <ul className={styles.list}>
            {milestones.map((milestone) => (
              <li key={milestone.id} className={styles.item}>
                <span className={styles.name}>{milestone.label}</span>
                <span className={styles.project}>{milestone.projectName}</span>
                <Button
                  variant="light"
                  size="sm"
                  loading={busy === milestone.id}
                  loadingLabel={labels.delivering}
                  disabled={pending}
                  onClick={() => {
                    run(milestone.id);
                  }}
                >
                  {labels.deliver}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className={styles.feedback} role="alert">
        {error === null ? null : labels.errors[error]}
      </p>
    </section>
  );
}
