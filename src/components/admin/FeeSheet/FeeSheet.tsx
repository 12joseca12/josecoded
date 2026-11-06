"use client";

import { type SyntheticEvent, useEffect, useRef, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import {
  type FeeActionResult,
  type FeeField,
  type FeeHandler,
  type FeeMode,
  feeModes,
  feeNoteMax,
  type FeeSheetLabels,
} from "@/types/admin-project-fee";

import styles from "./FeeSheet.module.css";

export interface FeeDraft {
  mode: FeeMode;
  amount: string;
  hourlyRate: string;
  hoursCap: string;
  note: string;
}

interface FeeSheetProps {
  projectId: string;
  initial: FeeDraft;
  existing: boolean;
  modeLocked: boolean;
  labels: FeeSheetLabels;
  save: FeeHandler;
}

interface Problem {
  field: FeeField | null;
  text: string;
}

function problemOf(result: FeeActionResult, labels: FeeSheetLabels): Problem | null {
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  if (result.status === "error") {
    const field =
      result.code === "fee_amount_exceeded"
        ? "amount"
        : result.code === "hours_cap_exceeded"
          ? "hoursCap"
          : result.code === "fee_has_items"
            ? "mode"
            : null;
    return { field, text: labels.errors[result.code] };
  }
  return null;
}

export function FeeSheet({
  projectId,
  initial,
  existing,
  modeLocked,
  labels,
  save,
}: FeeSheetProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const announce = useAnnounce();

  useEffect(() => {
    if (!pending && problem?.field) {
      form.current?.querySelector<HTMLElement>(`[name="${problem.field}"]`)?.focus();
    }
  }, [problem, pending]);

  const set = <K extends keyof FeeDraft>(key: K, value: FeeDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    startTransition(async () => {
      const result = await save({
        projectId,
        mode: draft.mode,
        amount: draft.mode === "fixed" ? draft.amount : "",
        hourlyRate: draft.mode === "hourly" ? draft.hourlyRate : "",
        hoursCap: draft.mode === "hourly" ? draft.hoursCap : "",
        note: draft.note,
        firstItemLabel: labels.fixedItemLabel,
      });
      if (result.status === "done") {
        announce(labels.done);
        setOpen(false);
        return;
      }
      setProblem(problemOf(result, labels));
    });
  };

  const errorOf = (field: FeeField) => (problem?.field === field ? problem.text : undefined);
  const generalError = problem !== null && problem.field === null ? problem.text : null;

  return (
    <>
      <Button
        variant="light"
        size="sm"
        onClick={() => {
          setDraft(initial);
          setProblem(null);
          setOpen(true);
        }}
      >
        {existing ? labels.openEdit : labels.open}
      </Button>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={labels.title}
        closeLabel={labels.close}
      >
        <form className={styles.form} onSubmit={onSubmit} ref={form} noValidate>
          <Field
            control="select"
            name="mode"
            label={labels.mode}
            value={draft.mode}
            onChange={(event) => {
              set("mode", event.currentTarget.value as FeeMode);
            }}
            error={errorOf("mode")}
            disabled={pending || modeLocked}
          >
            {feeModes.map((mode) => (
              <option key={mode} value={mode}>
                {labels.modes[mode]}
              </option>
            ))}
          </Field>
          {modeLocked ? <p className={styles.locked}>{labels.modeLocked}</p> : null}
          {draft.mode === "fixed" ? (
            <Field
              name="amount"
              label={labels.amount}
              hint={labels.amountHint}
              inputMode="decimal"
              autoComplete="off"
              value={draft.amount}
              onChange={(event) => {
                set("amount", event.currentTarget.value);
              }}
              error={errorOf("amount")}
              disabled={pending}
            />
          ) : null}
          {draft.mode === "hourly" ? (
            <div className={styles.grid}>
              <Field
                name="hourlyRate"
                label={labels.hourlyRate}
                inputMode="decimal"
                autoComplete="off"
                value={draft.hourlyRate}
                onChange={(event) => {
                  set("hourlyRate", event.currentTarget.value);
                }}
                error={errorOf("hourlyRate")}
                disabled={pending}
              />
              <Field
                name="hoursCap"
                label={labels.hoursCap}
                hint={labels.hoursCapHint}
                inputMode="decimal"
                autoComplete="off"
                optionalLabel={labels.optional}
                value={draft.hoursCap}
                onChange={(event) => {
                  set("hoursCap", event.currentTarget.value);
                }}
                error={errorOf("hoursCap")}
                disabled={pending}
              />
            </div>
          ) : null}
          <Field
            control="textarea"
            name="note"
            label={labels.note}
            optionalLabel={labels.optional}
            rows={3}
            maxLength={feeNoteMax}
            value={draft.note}
            onChange={(event) => {
              set("note", event.currentTarget.value);
            }}
            error={errorOf("note")}
            disabled={pending}
          />
          <div className={styles.actions}>
            <Button
              type="submit"
              variant="light"
              loading={pending}
              loadingLabel={labels.submitting}
            >
              {labels.submit}
            </Button>
          </div>
          <p className={styles.feedback} role="alert">
            {generalError}
          </p>
        </form>
      </Sheet>
    </>
  );
}
