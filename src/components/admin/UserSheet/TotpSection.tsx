"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import type { UserRow } from "@/types/users";
import type { ManageHandler, UserSheetLabels } from "@/types/users-manage";

import { describe, Feedback, type FeedbackState } from "./Feedback";
import styles from "./UserSheet.module.css";

interface TotpSectionProps {
  user: UserRow;
  labels: UserSheetLabels;
  reset: ManageHandler;
}

export function TotpSection({ user, labels, reset }: TotpSectionProps) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pending, startTransition] = useTransition();
  const disclosure = useRef<HTMLDetailsElement>(null);

  const confirm = () => {
    if (pending) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await reset({ userId: user.id });
      setFeedback(describe(result, labels, labels.resetDone));
      if (disclosure.current) disclosure.current.open = false;
    });
  };

  return (
    <section className={styles.section} aria-labelledby={`security-${user.id}`}>
      <h3 className={styles.sectionTitle} id={`security-${user.id}`}>
        {labels.securityTitle}
      </h3>
      <p className={styles.text}>{labels.securityText}</p>
      <details className={styles.confirm} ref={disclosure}>
        <summary className={styles.summary}>{labels.resetTotp}</summary>
        <div className={styles.row}>
          <Button
            variant="quiet"
            size="sm"
            loading={pending}
            loadingLabel={labels.resetting}
            onClick={confirm}
          >
            {labels.resetTotpConfirm}
          </Button>
        </div>
      </details>
      <Feedback state={feedback} />
    </section>
  );
}
