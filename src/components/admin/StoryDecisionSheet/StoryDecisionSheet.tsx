"use client";

import { type SyntheticEvent, useEffect, useRef, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import {
  type DecideHandler,
  type DecideResult,
  type DecisionField,
  decisionNoteMax,
  type StoryDecision,
  type StoryDecisionLabels,
  storyDecisions,
  type StoryRow,
} from "@/types/admin-project-stories";

import styles from "./StoryDecisionSheet.module.css";

interface StoryDecisionSheetProps {
  story: StoryRow;
  labels: StoryDecisionLabels;
  decide: DecideHandler;
}

interface Problem {
  field: DecisionField | null;
  text: string;
}

function problemOf(result: DecideResult, labels: StoryDecisionLabels): Problem | null {
  if (result.status === "invalid") {
    return { field: result.field, text: labels.errors[result.field] };
  }
  if (result.status === "error") {
    const field =
      result.code === "note_required"
        ? "note"
        : result.code === "estimate_required"
          ? "hours"
          : null;
    return { field, text: labels.errors[result.code] };
  }
  return null;
}

export function StoryDecisionSheet({ story, labels, decide }: StoryDecisionSheetProps) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<StoryDecision>("accept");
  const [hours, setHours] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [createTask, setCreateTask] = useState(true);
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
      const result = await decide({ id: story.id, decision, hours, amount, note, createTask });
      if (result.status === "done") {
        announce(labels.done[result.next]);
        setOpen(false);
        return;
      }
      setProblem(problemOf(result, labels));
    });
  };

  const errorOf = (field: DecisionField) => (problem?.field === field ? problem.text : undefined);
  const generalError = problem !== null && problem.field === null ? problem.text : null;
  const quote = decision === "out_of_scope";

  return (
    <>
      <Button
        variant="light"
        size="sm"
        aria-label={labels.openFor.replace("{title}", story.title)}
        onClick={() => {
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
        title={labels.title.replace("{title}", story.title)}
        closeLabel={labels.close}
      >
        <form className={styles.form} onSubmit={onSubmit} ref={form} noValidate>
          <Field
            control="select"
            name="decision"
            label={labels.decision}
            value={decision}
            onChange={(event) => {
              setDecision(event.currentTarget.value as StoryDecision);
            }}
            error={errorOf("decision")}
            disabled={pending}
          >
            {storyDecisions.map((option) => (
              <option key={option} value={option}>
                {labels.decisions[option]}
              </option>
            ))}
          </Field>
          {decision !== "reject" ? (
            <div className={styles.grid}>
              <Field
                name="hours"
                label={labels.hours}
                inputMode="decimal"
                autoComplete="off"
                optionalLabel={quote ? undefined : labels.optional}
                value={hours}
                onChange={(event) => {
                  setHours(event.currentTarget.value);
                }}
                error={errorOf("hours")}
                disabled={pending}
              />
              <Field
                name="amount"
                label={labels.amount}
                hint={quote ? labels.amountHint : undefined}
                inputMode="decimal"
                autoComplete="off"
                optionalLabel={quote ? undefined : labels.optional}
                value={amount}
                onChange={(event) => {
                  setAmount(event.currentTarget.value);
                }}
                error={errorOf("amount")}
                disabled={pending}
              />
            </div>
          ) : null}
          <Field
            control="textarea"
            name="note"
            label={labels.note}
            hint={decision === "reject" ? labels.noteHint : undefined}
            optionalLabel={decision === "reject" ? undefined : labels.optional}
            rows={4}
            maxLength={decisionNoteMax}
            value={note}
            onChange={(event) => {
              setNote(event.currentTarget.value);
            }}
            error={errorOf("note")}
            disabled={pending}
          />
          {decision === "accept" ? (
            <Checkbox
              name="createTask"
              checked={createTask}
              onChange={(event) => {
                setCreateTask(event.currentTarget.checked);
              }}
              disabled={pending}
            >
              {labels.createTask}
            </Checkbox>
          ) : null}
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
