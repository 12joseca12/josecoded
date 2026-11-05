"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import type { UserRow } from "@/types/users";
import type { ManageHandler, UserSheetLabels } from "@/types/users-manage";

import { describe, Feedback, type FeedbackState } from "./Feedback";
import styles from "./UserSheet.module.css";

interface StatusSectionProps {
  user: UserRow;
  labels: UserSheetLabels;
  setActive: ManageHandler;
}

export function StatusSection({ user, labels, setActive }: StatusSectionProps) {
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pending, startTransition] = useTransition();
  const disclosure = useRef<HTMLDetailsElement>(null);
  const active = user.is_active && user.archived_at === null;

  const change = (next: boolean) => {
    if (pending) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await setActive({ userId: user.id, active: next });
      setFeedback(describe(result, labels, next ? labels.reactivated : labels.deactivated));
      if (disclosure.current) disclosure.current.open = false;
    });
  };

  return (
    <section className={styles.section} aria-labelledby={`status-${user.id}`}>
      <h3 className={styles.sectionTitle} id={`status-${user.id}`}>
        {labels.statusTitle}
      </h3>
      <p className={styles.text}>{active ? labels.activeText : labels.inactiveText}</p>
      {active ? (
        <details className={styles.confirm} ref={disclosure}>
          <summary className={styles.summary}>{labels.deactivate}</summary>
          <div className={styles.row}>
            <Button
              variant="quiet"
              size="sm"
              loading={pending}
              loadingLabel={labels.working}
              onClick={() => {
                change(false);
              }}
            >
              {labels.deactivateConfirm}
            </Button>
          </div>
        </details>
      ) : (
        <div className={styles.row}>
          <Button
            variant="light"
            size="sm"
            loading={pending}
            loadingLabel={labels.working}
            onClick={() => {
              change(true);
            }}
          >
            {labels.reactivate}
          </Button>
        </div>
      )}
      <Feedback state={feedback} />
    </section>
  );
}
