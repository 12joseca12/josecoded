"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import type { JobActionHandler, JobActionResult, JobRow, JobTableLabels } from "@/types/system";

import styles from "./JobTable.module.css";

interface JobActionsProps {
  job: JobRow;
  labels: JobTableLabels;
  retry: JobActionHandler;
  cancel: JobActionHandler;
  onDone: (text: string) => void;
}

type Kind = "retry" | "cancel";

function failureText(result: JobActionResult, labels: JobTableLabels): string | null {
  if (result.status === "done") return null;
  return labels.errors[result.status];
}

export function JobActions({ job, labels, retry, cancel, onDone }: JobActionsProps) {
  const [asking, setAsking] = useState<Kind | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const wasAsking = useRef(false);

  const canRetry = job.status === "failed" || job.status === "cancelled";
  const canCancel = job.status === "queued";

  useEffect(() => {
    const target = root.current?.querySelector<HTMLElement>("button");
    if (asking || wasAsking.current) target?.focus();
    wasAsking.current = asking !== null;
  }, [asking]);

  if (!canRetry && !canCancel) return null;
  const kind: Kind = canRetry ? "retry" : "cancel";
  const handler = kind === "retry" ? retry : cancel;

  const confirm = () => {
    if (pending) return;
    setProblem(null);
    startTransition(async () => {
      const result = await handler({ jobId: job.id });
      setProblem(failureText(result, labels));
      if (result.status === "done") onDone(labels.done[kind]);
      if (result.status !== "error") setAsking(null);
    });
  };

  return (
    <div className={styles.actions} ref={root}>
      {asking === null ? (
        <Button
          type="button"
          variant="light"
          size="sm"
          onClick={() => {
            setProblem(null);
            setAsking(kind);
          }}
        >
          {kind === "retry" ? labels.retry : labels.cancel}
        </Button>
      ) : (
        <div
          className={styles.confirm}
          role="group"
          aria-label={labels[kind === "retry" ? "confirmRetry" : "confirmCancel"]}
        >
          <p className={styles.question}>
            {kind === "retry" ? labels.confirmRetry : labels.confirmCancel}
          </p>
          <div className={styles.answers}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={pending}
              loadingLabel={kind === "retry" ? labels.retrying : labels.cancelling}
              onClick={confirm}
            >
              {labels.confirmYes}
            </Button>
            <Button
              type="button"
              variant="quiet"
              size="sm"
              disabled={pending}
              onClick={() => {
                setAsking(null);
              }}
            >
              {labels.confirmNo}
            </Button>
          </div>
        </div>
      )}
      <p className={styles.problem} role="alert">
        {problem}
      </p>
    </div>
  );
}
