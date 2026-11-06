"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import {
  type FeeCardLabels,
  type FeeResult,
  type HoursHandler,
  hoursMax,
  labelMax,
} from "@/types/freelance-fees";

import styles from "./HoursForm.module.css";

interface HoursFormProps {
  projectId: string;
  today: string;
  labels: FeeCardLabels;
  submit: HoursHandler;
}

interface Problem {
  field: "hours" | "label" | "workedOn" | null;
  text: string;
}

function problemOf(result: FeeResult, labels: FeeCardLabels): Problem | null {
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  if (result.status !== "error") return null;
  const field =
    result.code === "hours_cap_exceeded" || result.code === "invalid_hours"
      ? "hours"
      : result.code === "future_date"
        ? "workedOn"
        : null;
  return { field, text: labels.errors[result.code] };
}

export function HoursForm({ projectId, today, labels, submit }: HoursFormProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const [hours, setHours] = useState("");
  const [label, setLabel] = useState("");
  const [workedOn, setWorkedOn] = useState(today);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    startTransition(async () => {
      let result: FeeResult;
      try {
        result = await submit({ projectId, hours, label, workedOn });
      } catch {
        result = { status: "error", code: "error" };
      }
      if (result.status === "done") {
        setHours("");
        setLabel("");
        announce(labels.form.done);
        router.refresh();
        return;
      }
      setProblem(problemOf(result, labels));
    });
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h3 className={styles.title}>{labels.form.title}</h3>
      <div className={styles.row}>
        <Field
          name="workedOn"
          label={labels.form.date}
          type="date"
          max={today}
          value={workedOn}
          onChange={(event) => {
            setWorkedOn(event.currentTarget.value);
          }}
          error={problem?.field === "workedOn" ? problem.text : undefined}
          disabled={pending}
        />
        <Field
          name="hours"
          label={labels.form.hours}
          hint={labels.form.hoursHint}
          inputMode="decimal"
          autoComplete="off"
          maxLength={String(hoursMax).length + 2}
          value={hours}
          onChange={(event) => {
            setHours(event.currentTarget.value);
          }}
          error={problem?.field === "hours" ? problem.text : undefined}
          disabled={pending}
        />
      </div>
      <Field
        name="label"
        label={labels.form.label}
        hint={labels.form.labelHint}
        maxLength={labelMax}
        value={label}
        onChange={(event) => {
          setLabel(event.currentTarget.value);
        }}
        error={problem?.field === "label" ? problem.text : undefined}
        disabled={pending}
      />
      <p className={styles.feedback} role="alert">
        {problem !== null && problem.field === null ? problem.text : null}
      </p>
      <div>
        <Button
          type="submit"
          variant="light"
          loading={pending}
          loadingLabel={labels.form.submitting}
        >
          {labels.form.submit}
        </Button>
      </div>
    </form>
  );
}
