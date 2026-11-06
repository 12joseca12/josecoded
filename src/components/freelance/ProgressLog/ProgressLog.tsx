"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { formatDay } from "@/lib/admin/users";
import {
  type ProgressLogLabels,
  type UpdateDeleteHandler,
  type UpdateErrorCode,
  type UpdateResult,
  type UpdateRow,
  type UpdateVisibility,
  type UpdateVisibilityHandler,
} from "@/types/project-updates";

import styles from "./ProgressLog.module.css";

interface ProgressLogProps {
  updates: UpdateRow[];
  userId: string;
  taskTitles: Record<string, string>;
  locale: string;
  labels: ProgressLogLabels;
  setVisibility: UpdateVisibilityHandler;
  remove: UpdateDeleteHandler;
  action: ReactNode;
}

export function ProgressLog({
  updates,
  userId,
  taskTitles,
  locale,
  labels,
  setVisibility,
  remove,
  action,
}: ProgressLogProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<UpdateErrorCode | null>(null);

  const run = (id: string, call: () => Promise<UpdateResult>, done: string | null) => {
    if (pending) return;
    setError(null);
    setBusy(id);
    startTransition(async () => {
      let result: UpdateResult;
      try {
        result = await call();
      } catch {
        result = { status: "error", code: "error" };
      }
      setBusy(null);
      setConfirming(null);
      if (result.status === "done") {
        if (done !== null) announce(done);
        router.refresh();
        return;
      }
      setError(result.status === "error" ? result.code : "error");
      router.refresh();
    });
  };

  return (
    <section className={styles.section} aria-labelledby="freelance-progress">
      <div className={styles.head}>
        <Heading level={2} size="h4" id="freelance-progress">
          {labels.title}
        </Heading>
        {action}
      </div>
      {updates.length === 0 ? (
        <p className={styles.empty}>{labels.empty}</p>
      ) : (
        <ul className={styles.list} aria-label={labels.list}>
          {updates.map((update) => {
            const mine = update.author_id === userId;
            const next: UpdateVisibility = update.visibility === "client" ? "internal" : "client";
            const taskTitle = update.task_id ? taskTitles[update.task_id] : undefined;
            return (
              <li key={update.id} className={styles.item}>
                <p className={styles.meta}>
                  <strong>{mine ? labels.authors.me : labels.authors.jose}</strong>
                  <time dateTime={update.created_at}>{formatDay(update.created_at, locale)}</time>
                  {taskTitle ? <span>{labels.task.replace("{title}", taskTitle)}</span> : null}
                </p>
                <p className={styles.body}>{update.body}</p>
                <div className={styles.controls}>
                  {mine ? (
                    <button
                      type="button"
                      className={styles.chip}
                      role="switch"
                      aria-checked={update.visibility === "client"}
                      aria-label={labels.toggle.replace(
                        "{state}",
                        labels.visibility[update.visibility],
                      )}
                      data-visibility={update.visibility}
                      disabled={pending}
                      onClick={() => {
                        run(update.id, () => setVisibility(update.id, next), null);
                      }}
                    >
                      {busy === update.id ? labels.toggling : labels.visibility[update.visibility]}
                    </button>
                  ) : (
                    <span className={styles.chip} data-visibility={update.visibility} data-static>
                      {labels.visibility[update.visibility]}
                    </span>
                  )}
                  {mine ? (
                    confirming === update.id ? (
                      <span className={styles.confirm} role="group" aria-label={labels.delete}>
                        <span>{labels.deleteConfirm}</span>
                        <Button
                          variant="light"
                          size="sm"
                          loading={pending}
                          loadingLabel={labels.deleting}
                          onClick={() => {
                            run(update.id, () => remove(update.id), labels.deleted);
                          }}
                        >
                          {labels.delete}
                        </Button>
                        <Button
                          variant="quiet"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setConfirming(null);
                          }}
                        >
                          {labels.cancel}
                        </Button>
                      </span>
                    ) : (
                      <Button
                        variant="quiet"
                        size="sm"
                        aria-label={labels.deleteFor.replace(
                          "{date}",
                          formatDay(update.created_at, locale),
                        )}
                        onClick={() => {
                          setError(null);
                          setConfirming(update.id);
                        }}
                      >
                        {labels.delete}
                      </Button>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className={styles.feedback} role="alert">
        {error === null ? null : labels.errors[error]}
      </p>
    </section>
  );
}
