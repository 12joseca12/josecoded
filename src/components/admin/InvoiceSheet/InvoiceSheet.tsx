"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import { centsToInput } from "@/lib/money";
import type {
  InvoiceSheetLabels,
  RecordInvoiceHandler,
  RecordInvoiceResult,
} from "@/types/payments";

import form from "../admin-form.module.css";

interface InvoiceSheetProps {
  dealId: string;
  scheduleId: string;
  defaultNetCents: number;
  defaultVat: string;
  today: string;
  labels: InvoiceSheetLabels;
  record: RecordInvoiceHandler;
  trigger: { text: string; aria: string };
}

type Problem = {
  field: "number" | "date" | "net" | "vat" | "file" | null;
  text: string;
} | null;

function problemOf(result: RecordInvoiceResult, labels: InvoiceSheetLabels): Problem {
  if (result.status === "done") return null;
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  const field = result.code === "fileType" || result.code === "fileSize" ? "file" : null;
  return { field, text: labels.errors[result.code] };
}

export function InvoiceSheet({
  dealId,
  scheduleId,
  defaultNetCents,
  defaultVat,
  today,
  labels,
  record,
  trigger,
}: InvoiceSheetProps) {
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [problem, setProblem] = useState<Problem>(null);
  const [saving, startSaving] = useTransition();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    data.set("dealId", dealId);
    data.set("scheduleId", scheduleId);
    setProblem(null);
    startSaving(async () => {
      const result = await record(data);
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === null) {
        announce(labels.done);
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        variant="quiet"
        size="sm"
        aria-label={trigger.aria}
        onClick={() => {
          setSession((value) => value + 1);
          setProblem(null);
          setOpen(true);
        }}
      >
        {trigger.text}
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
          <p>{labels.text}</p>
          <Field
            name="number"
            label={labels.number}
            maxLength={60}
            autoComplete="off"
            error={problem?.field === "number" ? problem.text : undefined}
          />
          <div className={form.row}>
            <Field
              name="issuedAt"
              type="date"
              label={labels.date}
              max={today}
              defaultValue={today}
              error={problem?.field === "date" ? problem.text : undefined}
            />
            <Field
              name="net"
              label={labels.net}
              inputMode="decimal"
              autoComplete="off"
              defaultValue={centsToInput(defaultNetCents)}
              error={problem?.field === "net" ? problem.text : undefined}
            />
            <Field
              name="vat"
              label={labels.vat}
              inputMode="decimal"
              autoComplete="off"
              defaultValue={defaultVat}
              error={problem?.field === "vat" ? problem.text : undefined}
            />
          </div>
          <Field
            name="file"
            type="file"
            accept="application/pdf"
            label={labels.file}
            hint={labels.fileHint}
            optionalLabel={labels.optional}
            error={problem?.field === "file" ? problem.text : undefined}
          />
          <p
            className={form.feedback}
            data-tone="error"
            role="alert"
            hidden={problem?.field !== null}
          >
            {problem?.field === null ? problem.text : ""}
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
