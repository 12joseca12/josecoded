"use client";

import { useState, useTransition } from "react";

import { signOutSessions } from "@/app/[locale]/(private)/cuenta/actions";
import { Button } from "@/components/ui/Button/Button";
import type { SessionsLabels } from "@/types/account";

import { AccountFeedback, type FeedbackState } from "../AccountFeedback/AccountFeedback";
import { ConfirmAction } from "../ConfirmAction/ConfirmAction";
import styles from "./SessionActions.module.css";

interface SessionActionsProps {
  locale: string;
  labels: SessionsLabels;
}

export function SessionActions({ locale, labels }: SessionActionsProps) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const closeOthers = () => {
    if (pending) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await signOutSessions(locale, "others");
      setFeedback(
        result.status === "done"
          ? { tone: "success", text: labels.othersDone }
          : { tone: "error", text: labels.error },
      );
    });
  };

  const closeAll = async () => {
    setFeedback(null);
    const result = await signOutSessions(locale, "global");
    if (result.status === "error") setFeedback({ tone: "error", text: labels.error });
  };

  return (
    <div className={styles.actions}>
      <div className={styles.row}>
        <Button
          type="button"
          variant="light"
          loading={pending}
          loadingLabel={labels.othersLoading}
          onClick={closeOthers}
        >
          {labels.others}
        </Button>
        <ConfirmAction
          trigger={labels.everywhere}
          loadingLabel={labels.everywhereLoading}
          labels={labels.everywhereConfirm}
          run={closeAll}
        />
      </div>
      <AccountFeedback feedback={feedback} />
    </div>
  );
}
