"use client";

import { useState, useTransition } from "react";

import { ConfirmAction } from "@/components/admin/ConfirmAction/ConfirmAction";
import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import type { UpdateHandler, UpdateRow, UpdatesPanelLabels } from "@/types/admin-project-updates";

import styles from "./UpdateItem.module.css";

interface UpdateItemProps {
  update: UpdateRow;
  author: string;
  taskTitle: string | null;
  locale: string;
  labels: UpdatesPanelLabels;
  setVisibility: UpdateHandler;
  remove: UpdateHandler;
}

export function UpdateItem({
  update,
  author,
  taskTitle,
  locale,
  labels,
  setVisibility,
  remove,
}: UpdateItemProps) {
  const [problem, setProblem] = useState("");
  const [pending, startTransition] = useTransition();
  const announce = useAnnounce();
  const toClient = update.visibility === "internal";

  const toggle = () => {
    if (pending) return;
    setProblem("");
    startTransition(async () => {
      const result = await setVisibility({
        id: update.id,
        visibility: toClient ? "client" : "internal",
      });
      if (result.status === "done") {
        announce(toClient ? labels.published : labels.hidden);
        return;
      }
      setProblem(labels.errors[result.status === "error" ? result.code : "error"]);
    });
  };

  return (
    <article className={styles.item} data-visibility={update.visibility}>
      <div className={styles.head}>
        <span className={styles.author}>{author}</span>
        <time dateTime={update.created_at}>{formatDay(update.created_at, locale)}</time>
        <StatusPill tone={update.visibility === "client" ? "done" : "muted"}>
          {labels.visibility[update.visibility]}
        </StatusPill>
      </div>
      <p className={styles.body}>{update.body}</p>
      {taskTitle === null ? null : (
        <p className={styles.task}>{labels.task.replace("{title}", taskTitle)}</p>
      )}
      <div className={styles.actions}>
        <Button
          variant="light"
          size="sm"
          loading={pending}
          loadingLabel={toClient ? labels.publishing : labels.hiding}
          onClick={toggle}
        >
          {toClient ? labels.publish : labels.hide}
        </Button>
        <ConfirmAction
          triggerText={labels.delete}
          triggerAria={labels.deleteFor.replace("{author}", author)}
          title={labels.deleteTitle}
          text={labels.deleteText}
          submitLabel={labels.deleteSubmit}
          savingLabel={labels.deleting}
          closeLabel={labels.close}
          doneMessage={labels.deleted}
          errors={labels.errors}
          run={async () => {
            const result = await remove({ id: update.id });
            if (result.status === "done") return { status: "done" } as const;
            return {
              status: "failed",
              code: result.status === "error" ? result.code : "error",
            } as const;
          }}
        />
      </div>
      <p className={styles.feedback} role="alert">
        {problem}
      </p>
    </article>
  );
}
