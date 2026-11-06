"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import type { MyTask, ReviewStory, TodoActionResult, TodoHandler } from "@/types/area";

import styles from "./TodoForYou.module.css";

export interface TodoLabels {
  title: string;
  empty: string;
  tasksTitle: string;
  storiesTitle: string;
  complete: string;
  completing: string;
  confirm: string;
  confirming: string;
  decline: string;
  declining: string;
  estimate: string;
  note: string;
  phases: Record<MyTask["phase"], string>;
  errors: Record<"forbidden" | "stale" | "error", string>;
  done: { task: string; confirm: string; decline: string };
}

interface TodoForYouProps {
  tasks: MyTask[];
  stories: ReviewStory[];
  locale: string;
  labels: TodoLabels;
  complete: TodoHandler;
  decide: TodoHandler;
}

type Pending = { id: string; action: "complete" | "confirm" | "decline" } | null;

export function TodoForYou({ tasks, stories, locale, labels, complete, decide }: TodoForYouProps) {
  const [pending, setPending] = useState<Pending>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  const run = (
    id: string,
    action: NonNullable<Pending>["action"],
    call: () => Promise<TodoActionResult>,
  ) => {
    setPending({ id, action });
    setMessage("");
    setFailed(false);
    startTransition(async () => {
      const result = await call();
      setPending(null);
      if (result.status === "done")
        setMessage(labels.done[action === "complete" ? "task" : action]);
      else {
        setFailed(true);
        setMessage(labels.errors[result.status]);
      }
    });
  };

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const busy = pending !== null;
  const empty = tasks.length === 0 && stories.length === 0;

  return (
    <section className={styles.section} aria-labelledby="area-todo">
      <Heading level={2} size="h4" id="area-todo">
        {labels.title}
      </Heading>
      {empty ? <p className={styles.empty}>{labels.empty}</p> : null}
      {stories.length > 0 ? (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>{labels.storiesTitle}</h3>
          <ul className={styles.list}>
            {stories.map((story) => (
              <li key={story.id} className={styles.item}>
                <p className={styles.itemTitle}>{story.title}</p>
                <p className={styles.detail}>
                  {labels.estimate
                    .replace("{hours}", number.format(story.estimate_hours ?? 0))
                    .replace("{amount}", number.format(story.estimate_amount ?? 0))}
                </p>
                {story.decision_note ? (
                  <p className={styles.detail}>
                    {labels.note} {story.decision_note}
                  </p>
                ) : null}
                <div className={styles.actions}>
                  <Button
                    size="sm"
                    loading={pending?.id === story.id && pending.action === "confirm"}
                    loadingLabel={labels.confirming}
                    disabled={busy}
                    onClick={() => {
                      run(story.id, "confirm", () => decide(story.id, true));
                    }}
                  >
                    {labels.confirm}
                  </Button>
                  <Button
                    size="sm"
                    variant="quiet"
                    loading={pending?.id === story.id && pending.action === "decline"}
                    loadingLabel={labels.declining}
                    disabled={busy}
                    onClick={() => {
                      run(story.id, "decline", () => decide(story.id, false));
                    }}
                  >
                    {labels.decline}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {tasks.length > 0 ? (
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>{labels.tasksTitle}</h3>
          <ul className={styles.list}>
            {tasks.map((task) => (
              <li key={task.id} className={styles.item}>
                <p className={styles.itemTitle}>{task.title}</p>
                <p className={styles.detail}>{labels.phases[task.phase]}</p>
                <div className={styles.actions}>
                  <Button
                    size="sm"
                    variant="light"
                    loading={pending?.id === task.id}
                    loadingLabel={labels.completing}
                    disabled={busy}
                    onClick={() => {
                      run(task.id, "complete", () => complete(task.id));
                    }}
                  >
                    {labels.complete}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className={styles.status} role="status" data-failed={failed || undefined}>
        {message}
      </p>
    </section>
  );
}
