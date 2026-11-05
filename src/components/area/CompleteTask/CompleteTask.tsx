"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import type { TodoHandler } from "@/types/area";

import styles from "./CompleteTask.module.css";

export interface CompleteTaskLabels {
  complete: string;
  completing: string;
  done: string;
  errors: Record<"forbidden" | "stale" | "error", string>;
}

interface CompleteTaskProps {
  taskId: string;
  finished: boolean;
  complete: TodoHandler;
  labels: CompleteTaskLabels;
}

export function CompleteTask({ taskId, finished, complete, labels }: CompleteTaskProps) {
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    setMessage("");
    setFailed(false);
    startTransition(async () => {
      const result = await complete(taskId);
      if (result.status === "done") setMessage(labels.done);
      else {
        setFailed(true);
        setMessage(labels.errors[result.status]);
      }
    });
  };

  return (
    <div className={styles.box}>
      {finished ? null : (
        <Button size="sm" loading={pending} loadingLabel={labels.completing} onClick={onClick}>
          {labels.complete}
        </Button>
      )}
      <p className={styles.status} role="status" data-failed={failed || undefined}>
        {message}
      </p>
    </div>
  );
}
