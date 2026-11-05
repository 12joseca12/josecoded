"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import type {
  CancelRecurringHandler,
  CancelRecurringLabels,
  CancelRecurringResult,
} from "@/types/deal-win";

import form from "../sheet-form.module.css";

interface CancelRecurringButtonProps {
  dealId: string;
  contactName: string;
  labels: CancelRecurringLabels;
  cancel: CancelRecurringHandler;
  onDone: (message: string) => void;
}

function problemOf(result: CancelRecurringResult, labels: CancelRecurringLabels): string {
  return result.status === "done" ? "" : labels.errors[result.status];
}

export function CancelRecurringButton({
  dealId,
  contactName,
  labels,
  cancel,
  onDone,
}: CancelRecurringButtonProps) {
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [saving, startSaving] = useTransition();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setProblem("");
    startSaving(async () => {
      const result = await cancel({ dealId });
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === "") {
        onDone(labels.done);
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        variant="quiet"
        size="sm"
        aria-label={labels.openAria.replace("{name}", contactName)}
        onClick={() => {
          setProblem("");
          setOpen(true);
        }}
      >
        {labels.open}
      </Button>
      <ModalSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={labels.title}
        closeLabel={labels.close}
      >
        <form className={form.form} onSubmit={onSubmit}>
          <p>{labels.text}</p>
          <p className={form.feedback} data-tone="error" role="alert" hidden={problem === ""}>
            {problem}
          </p>
          <div className={form.actions}>
            <Button type="submit" variant="primary" loading={saving} loadingLabel={labels.saving}>
              {labels.submit}
            </Button>
          </div>
        </form>
      </ModalSheet>
    </>
  );
}
