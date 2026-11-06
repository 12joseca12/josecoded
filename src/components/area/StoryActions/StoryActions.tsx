"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import type { StoryDeleteResult, TodoActionResult } from "@/types/area";

import styles from "./StoryActions.module.css";

export interface StoryActionsLabels {
  edit: string;
  remove: string;
  removeAsk: string;
  removeYes: string;
  removeNo: string;
  removing: string;
  confirm: string;
  confirming: string;
  decline: string;
  declining: string;
  doneConfirm: string;
  doneDecline: string;
  errors: Record<"forbidden" | "stale" | "error", string>;
}

interface StoryActionsProps {
  storyId: string;
  mode: "manage" | "review" | "none";
  editHref: string;
  listHref: string;
  labels: StoryActionsLabels;
  remove: (id: string) => Promise<StoryDeleteResult>;
  decide: (id: string, accept: boolean) => Promise<TodoActionResult>;
}

type Busy = "remove" | "confirm" | "decline" | null;

export function StoryActions({
  storyId,
  mode,
  editHref,
  listHref,
  labels,
  remove,
  decide,
}: StoryActionsProps) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  const fail = (status: "forbidden" | "stale" | "error") => {
    setFailed(true);
    setMessage(labels.errors[status]);
  };

  const onRemove = () => {
    setBusy("remove");
    setMessage("");
    setFailed(false);
    startTransition(async () => {
      const result = await remove(storyId);
      setBusy(null);
      if (result.status === "done") router.push(listHref);
      else fail(result.status);
    });
  };

  const onDecide = (accept: boolean) => {
    setBusy(accept ? "confirm" : "decline");
    setMessage("");
    setFailed(false);
    startTransition(async () => {
      const result = await decide(storyId, accept);
      setBusy(null);
      if (result.status === "done") setMessage(accept ? labels.doneConfirm : labels.doneDecline);
      else fail(result.status);
    });
  };

  const working = busy !== null;

  return (
    <div className={styles.box}>
      {mode === "review" ? (
        <div className={styles.row}>
          <Button
            loading={busy === "confirm"}
            loadingLabel={labels.confirming}
            disabled={working}
            onClick={() => {
              onDecide(true);
            }}
          >
            {labels.confirm}
          </Button>
          <Button
            variant="quiet"
            loading={busy === "decline"}
            loadingLabel={labels.declining}
            disabled={working}
            onClick={() => {
              onDecide(false);
            }}
          >
            {labels.decline}
          </Button>
        </div>
      ) : null}
      {mode === "manage" && !asking ? (
        <div className={styles.row}>
          <Button href={editHref} variant="light" size="sm">
            {labels.edit}
          </Button>
          <Button
            variant="quiet"
            size="sm"
            onClick={() => {
              setAsking(true);
            }}
          >
            {labels.remove}
          </Button>
        </div>
      ) : null}
      {mode === "manage" && asking ? (
        <div className={styles.row} role="group" aria-label={labels.removeAsk}>
          <p className={styles.ask}>{labels.removeAsk}</p>
          <Button
            size="sm"
            loading={busy === "remove"}
            loadingLabel={labels.removing}
            disabled={working}
            onClick={onRemove}
          >
            {labels.removeYes}
          </Button>
          <Button
            size="sm"
            variant="quiet"
            disabled={working}
            onClick={() => {
              setAsking(false);
            }}
          >
            {labels.removeNo}
          </Button>
        </div>
      ) : null}
      <p className={styles.status} role="status" data-failed={failed || undefined}>
        {message}
      </p>
    </div>
  );
}
