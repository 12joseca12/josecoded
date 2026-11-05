"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import type {
  IssueProformaHandler,
  IssueProformaResult,
  ProformaSheetLabels,
} from "@/types/payments";

import form from "../admin-form.module.css";

interface ProformaSheetProps {
  scheduleId: string;
  defaultVat: string;
  locale: string;
  labels: ProformaSheetLabels;
  issue: IssueProformaHandler;
  trigger: { text: string; aria: string };
  available: boolean;
}

type Issued = { id: string; number: string } | null;

function problemOf(result: IssueProformaResult, labels: ProformaSheetLabels): string {
  if (result.status === "done") return "";
  if (result.status === "invalid") return labels.errors.vat;
  return labels.errors[result.code];
}

export function ProformaSheet({
  scheduleId,
  defaultVat,
  locale,
  labels,
  issue,
  trigger,
  available,
}: ProformaSheetProps) {
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const [vat, setVat] = useState(defaultVat);
  const [problem, setProblem] = useState("");
  const [issued, setIssued] = useState<Issued>(null);
  const [saving, startSaving] = useTransition();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setProblem("");
    startSaving(async () => {
      const result = await issue({ scheduleId, vat });
      const next = problemOf(result, labels);
      setProblem(next);
      if (result.status === "done") {
        setIssued({ id: result.id, number: result.number });
        announce(labels.done.replace("{number}", result.number));
      }
    });
  };

  return (
    <>
      {available ? (
        <Button
          variant="quiet"
          size="sm"
          aria-label={trigger.aria}
          onClick={() => {
            setVat(defaultVat);
            setProblem("");
            setIssued(null);
            setOpen(true);
          }}
        >
          {trigger.text}
        </Button>
      ) : null}
      <ModalSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={labels.title}
        closeLabel={labels.close}
      >
        {issued ? (
          <div className={form.form}>
            <p>{labels.done.replace("{number}", issued.number)}</p>
            <div className={form.actions}>
              <Button
                variant="primary"
                href={`/${locale}/admin/cobros/proformas/${issued.id}/imprimir`}
              >
                {labels.view}
              </Button>
            </div>
          </div>
        ) : (
          <form className={form.form} onSubmit={onSubmit} noValidate>
            <p>{labels.text}</p>
            <Field
              name="vat"
              label={labels.vat}
              hint={labels.vatHint}
              inputMode="decimal"
              autoComplete="off"
              value={vat}
              onChange={(event) => {
                setVat(event.target.value);
              }}
              error={problem === labels.errors.vat ? problem : undefined}
            />
            <p
              className={form.feedback}
              data-tone="error"
              role="alert"
              hidden={problem === "" || problem === labels.errors.vat}
            >
              {problem === labels.errors.vat ? "" : problem}
            </p>
            <div className={form.actions}>
              <Button type="submit" variant="primary" loading={saving} loadingLabel={labels.saving}>
                {labels.submit}
              </Button>
            </div>
          </form>
        )}
      </ModalSheet>
    </>
  );
}
