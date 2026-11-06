"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import type { CommissionLineTableLabels, RejectHandler } from "@/types/commissions";

import form from "../sheet-form.module.css";

interface RejectLineSheetProps {
  lineId: string;
  name: string;
  amount: string;
  labels: CommissionLineTableLabels["reject"];
  reject: RejectHandler;
}

export function RejectLineSheet({ lineId, name, amount, labels, reject }: RejectLineSheetProps) {
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [reason, setReason] = useState("");
  const [problem, setProblem] = useState("");
  const [field, setField] = useState(false);
  const [saving, startSaving] = useTransition();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setProblem("");
    setField(false);
    startSaving(async () => {
      const result = await reject({ id: lineId, reason });
      if (result.status === "done") {
        announce(labels.done);
        setOpen(false);
        return;
      }
      setProblem(labels.errors[result.code]);
      setField(result.code === "reason_required");
    });
  };

  return (
    <>
      <Button
        variant="quiet"
        size="sm"
        aria-label={labels.openAria.replace("{name}", name).replace("{amount}", amount)}
        onClick={() => {
          setSession((value) => value + 1);
          setReason("");
          setProblem("");
          setField(false);
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
        <form key={session} className={form.form} onSubmit={onSubmit} noValidate>
          <Field
            control="textarea"
            name="reason"
            label={labels.reason}
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            error={field ? problem : undefined}
          />
          <p
            className={form.feedback}
            data-tone="error"
            role="alert"
            hidden={field || problem === ""}
          >
            {field ? "" : problem}
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
