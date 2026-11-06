"use client";

import { type SyntheticEvent, useEffect, useRef, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import {
  type AddItemSheetLabels,
  type FeeActionResult,
  type FeeField,
  type FeeHandler,
  feeLabelMax,
} from "@/types/admin-project-fee";

import styles from "./AddItemSheet.module.css";

interface AddItemSheetProps {
  feeId: string;
  remaining: string | null;
  labels: AddItemSheetLabels;
  add: FeeHandler;
}

interface Problem {
  field: FeeField | null;
  text: string;
}

function problemOf(result: FeeActionResult, labels: AddItemSheetLabels): Problem | null {
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  if (result.status === "error") {
    const field =
      result.code === "fee_amount_exceeded" || result.code === "invalid_amount"
        ? "amount"
        : result.code === "invalid_label"
          ? "label"
          : null;
    return { field, text: labels.errors[result.code] };
  }
  return null;
}

export function AddItemSheet({ feeId, remaining, labels, add }: AddItemSheetProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [workedOn, setWorkedOn] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const announce = useAnnounce();

  useEffect(() => {
    if (!pending && problem?.field) {
      form.current?.querySelector<HTMLElement>(`[name="${problem.field}"]`)?.focus();
    }
  }, [problem, pending]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    startTransition(async () => {
      const result = await add({ feeId, label, amount, workedOn });
      if (result.status === "done") {
        announce(labels.done);
        setLabel("");
        setAmount("");
        setWorkedOn("");
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
          setProblem(null);
          setOpen(true);
        }}
      >
        {labels.open}
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
            name="label"
            label={labels.label}
            maxLength={feeLabelMax}
            autoComplete="off"
            value={label}
            onChange={(event) => {
              setLabel(event.currentTarget.value);
            }}
            error={errorOf("label")}
            disabled={pending}
          />
          <Field
            name="amount"
            label={labels.amount}
            hint={remaining === null ? undefined : labels.remaining.replace("{amount}", remaining)}
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(event) => {
              setAmount(event.currentTarget.value);
            }}
            error={errorOf("amount")}
            disabled={pending}
          />
          <Field
            name="workedOn"
            type="date"
            label={labels.workedOn}
            optionalLabel={labels.optional}
            value={workedOn}
            onChange={(event) => {
              setWorkedOn(event.currentTarget.value);
            }}
            error={errorOf("workedOn")}
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
