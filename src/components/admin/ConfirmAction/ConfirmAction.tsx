"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";

import form from "../admin-form.module.css";

interface ConfirmActionProps {
  triggerText: string;
  triggerAria: string;
  title: string;
  text: string;
  submitLabel: string;
  savingLabel: string;
  closeLabel: string;
  doneMessage: string;
  errors: Record<string, string>;
  run: () => Promise<{ status: "done" } | { status: "failed"; code: string }>;
}

export function ConfirmAction({
  triggerText,
  triggerAria,
  title,
  text,
  submitLabel,
  savingLabel,
  closeLabel,
  doneMessage,
  errors,
  run,
}: ConfirmActionProps) {
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [saving, startSaving] = useTransition();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setProblem("");
    startSaving(async () => {
      const result = await run();
      if (result.status === "done") {
        announce(doneMessage);
        setOpen(false);
        return;
      }
      setProblem(errors[result.code] ?? errors.error ?? "");
    });
  };

  return (
    <>
      <Button
        variant="quiet"
        size="sm"
        aria-label={triggerAria}
        onClick={() => {
          setProblem("");
          setOpen(true);
        }}
      >
        {triggerText}
      </Button>
      <ModalSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={title}
        closeLabel={closeLabel}
      >
        <form className={form.form} onSubmit={onSubmit}>
          <p>{text}</p>
          <p className={form.feedback} data-tone="error" role="alert" hidden={problem === ""}>
            {problem}
          </p>
          <div className={form.actions}>
            <Button type="submit" variant="primary" loading={saving} loadingLabel={savingLabel}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </ModalSheet>
    </>
  );
}
