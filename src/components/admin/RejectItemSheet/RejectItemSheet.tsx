"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import { type FeeHandler, type FeeItemTableLabels, feeReasonMax } from "@/types/admin-project-fee";

import styles from "./RejectItemSheet.module.css";

interface RejectItemSheetProps {
  id: string;
  itemLabel: string;
  labels: FeeItemTableLabels;
  reject: FeeHandler;
}

export function RejectItemSheet({ id, itemLabel, labels, reject }: RejectItemSheetProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [problem, setProblem] = useState<{ field: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const announce = useAnnounce();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    startTransition(async () => {
      const result = await reject({ id, reason });
      if (result.status === "done") {
        announce(labels.rejected);
        setReason("");
        setOpen(false);
        return;
      }
      if (result.status === "invalid") {
        setProblem({ field: true, text: labels.errors.reason });
        return;
      }
      setProblem({
        field: result.code === "reason_required",
        text: labels.errors[result.code],
      });
    });
  };

  return (
    <>
      <Button
        variant="quiet"
        size="sm"
        aria-label={labels.rejectOpenFor.replace("{label}", itemLabel)}
        onClick={() => {
          setProblem(null);
          setOpen(true);
        }}
      >
        {labels.rejectOpen}
      </Button>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={labels.rejectTitle.replace("{label}", itemLabel)}
        closeLabel={labels.close}
      >
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <Field
            control="textarea"
            name="reason"
            label={labels.rejectReason}
            rows={3}
            maxLength={feeReasonMax}
            value={reason}
            onChange={(event) => {
              setReason(event.currentTarget.value);
            }}
            error={problem?.field ? problem.text : undefined}
            disabled={pending}
          />
          <div className={styles.actions}>
            <Button type="submit" variant="light" loading={pending} loadingLabel={labels.rejecting}>
              {labels.rejectSubmit}
            </Button>
          </div>
          <p className={styles.feedback} role="alert">
            {problem !== null && !problem.field ? problem.text : null}
          </p>
        </form>
      </Sheet>
    </>
  );
}
