"use client";

import { useRef, useState, useTransition } from "react";

import { InviteLink } from "@/components/admin/InviteLink/InviteLink";
import { Button } from "@/components/ui/Button/Button";
import type {
  InvitationActionLabels,
  InvitationActionResult,
  InvitationHandler,
} from "@/types/users";

import styles from "./InvitationList.module.css";

interface InvitationActionsProps {
  invitationId: string;
  labels: InvitationActionLabels;
  renew: InvitationHandler;
  revoke: InvitationHandler;
}

type Feedback = { tone: "success" | "error"; text: string } | null;

export function InvitationActions({ invitationId, labels, renew, revoke }: InvitationActionsProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [path, setPath] = useState<string | null>(null);
  const [renewing, startRenew] = useTransition();
  const [revoking, startRevoke] = useTransition();
  const disclosure = useRef<HTMLDetailsElement>(null);
  const busy = renewing || revoking;

  const describe = (result: InvitationActionResult, done: string): Feedback =>
    result.status === "done"
      ? { tone: "success", text: done }
      : { tone: "error", text: labels.errors[result.code] };

  const onRenew = () => {
    if (busy) return;
    setFeedback(null);
    startRenew(async () => {
      const result = await renew({ invitationId });
      setFeedback(describe(result, labels.doneRenew));
      if (result.status === "done") setPath(result.path);
    });
  };

  const onRevoke = () => {
    if (busy) return;
    setFeedback(null);
    startRevoke(async () => {
      const result = await revoke({ invitationId });
      setFeedback(describe(result, labels.doneRevoke));
      if (result.status === "done" && disclosure.current) disclosure.current.open = false;
    });
  };

  return (
    <div className={styles.actions}>
      <div className={styles.row}>
        <Button
          variant="light"
          size="sm"
          loading={renewing}
          loadingLabel={labels.renewing}
          disabled={revoking}
          onClick={onRenew}
        >
          {labels.renew}
        </Button>
        <details className={styles.revoke} ref={disclosure}>
          <summary className={styles.summary}>{labels.revoke}</summary>
          <div className={styles.row}>
            <Button
              variant="quiet"
              size="sm"
              loading={revoking}
              loadingLabel={labels.revoking}
              disabled={renewing}
              onClick={onRevoke}
            >
              {labels.revokeConfirm}
            </Button>
          </div>
        </details>
      </div>
      {path !== null ? (
        <InviteLink
          path={path}
          label={labels.linkLabel}
          copyLabel={labels.copy}
          copiedLabel={labels.copied}
        />
      ) : null}
      <p
        className={styles.feedback}
        data-tone={feedback?.tone}
        role={feedback?.tone === "error" ? "alert" : "status"}
      >
        {feedback?.text}
      </p>
    </div>
  );
}
