"use client";

import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import type { UserRow } from "@/types/users";
import type { ReassignHandler, ReassignTarget, UserSheetLabels } from "@/types/users-manage";

import { Feedback, type FeedbackState } from "./Feedback";
import styles from "./UserSheet.module.css";

interface ReassignSectionProps {
  user: UserRow;
  targets: ReassignTarget[];
  labels: UserSheetLabels;
  reassign: ReassignHandler;
}

export function ReassignSection({ user, targets, labels, reassign }: ReassignSectionProps) {
  const [target, setTarget] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [pending, startTransition] = useTransition();
  const disclosure = useRef<HTMLDetailsElement>(null);
  const counts = labels.portfolioCounts
    .replace("{contacts}", String(user.contacts_count))
    .replace("{deals}", String(user.open_deals));

  const confirm = () => {
    if (pending) return;
    if (target === "") {
      setFeedback({ tone: "error", text: labels.errors.invalid_assignee });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await reassign({ fromUserId: user.id, toUserId: target });
      if (result.status === "done") {
        setFeedback({
          tone: "success",
          text: labels.reassigned
            .replace("{contacts}", String(result.contacts))
            .replace("{deals}", String(result.deals))
            .replace("{leads}", String(result.leads)),
        });
        setTarget("");
        if (disclosure.current) disclosure.current.open = false;
        return;
      }
      setFeedback({ tone: "error", text: labels.errors[result.code] });
    });
  };

  return (
    <section className={styles.section} aria-labelledby={`portfolio-${user.id}`}>
      <h3 className={styles.sectionTitle} id={`portfolio-${user.id}`}>
        {labels.portfolioTitle}
      </h3>
      <p className={styles.text}>{labels.portfolioText}</p>
      <p className={styles.text}>{counts}</p>
      {targets.length === 0 ? (
        <p className={styles.hint}>{labels.reassignNoTargets}</p>
      ) : (
        <details className={styles.confirm} ref={disclosure}>
          <summary className={styles.summary}>{labels.reassign}</summary>
          <div className={styles.stack}>
            <Field
              control="select"
              name="reassignTo"
              label={labels.reassignTo}
              value={target}
              onChange={(event) => {
                setTarget(event.currentTarget.value);
              }}
              disabled={pending}
            >
              <option value="">{labels.reassignPlaceholder}</option>
              {targets.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </Field>
            <div className={styles.row}>
              <Button
                variant="quiet"
                size="sm"
                loading={pending}
                loadingLabel={labels.reassigning}
                onClick={confirm}
              >
                {labels.reassignConfirm}
              </Button>
            </div>
          </div>
        </details>
      )}
      <Feedback state={feedback} />
    </section>
  );
}
