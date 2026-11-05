"use client";

import { type SyntheticEvent, useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import {
  activityBodyMax,
  type ActivityComposerLabels,
  type AddActivityHandler,
  type AddActivityResult,
  loggableKinds,
} from "@/types/crm-detail";

import form from "../sheet-form.module.css";
import styles from "./ActivityComposer.module.css";

interface DealOption {
  id: string;
  label: string;
}

interface ActivityComposerProps {
  contactId: string;
  deals: DealOption[];
  labels: ActivityComposerLabels;
  add: AddActivityHandler;
}

type Problem = { field: "kind" | "body" | "dealId" | null; text: string } | null;

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function problemOf(result: AddActivityResult, labels: ActivityComposerLabels): Problem {
  if (result.status === "done") return null;
  if (result.status === "invalid") {
    return { field: result.field, text: labels.errors[result.field] };
  }
  return { field: null, text: labels.errors[result.status] };
}

export function ActivityComposer({ contactId, deals, labels, add }: ActivityComposerProps) {
  const id = useId();
  const [session, setSession] = useState(0);
  const [problem, setProblem] = useState<Problem>(null);
  const [done, setDone] = useState(false);
  const [saving, startSaving] = useTransition();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const element = event.currentTarget;
    const data = new FormData(element);
    setProblem(null);
    setDone(false);
    startSaving(async () => {
      const result = await add({
        contactId,
        dealId: textOf(data, "dealId"),
        kind: textOf(data, "kind"),
        body: textOf(data, "body"),
      });
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === null) {
        setDone(true);
        setSession((value) => value + 1);
        return;
      }
      const control = next.field ? element.elements.namedItem(next.field) : null;
      if (control instanceof HTMLElement) control.focus();
    });
  };

  const general = problem !== null && problem.field !== "body" ? problem.text : "";

  return (
    <form key={session} className={styles.composer} onSubmit={onSubmit} noValidate>
      <div className={styles.row}>
        <div className={form.field}>
          <label htmlFor={`${id}-kind`} className={form.label}>
            {labels.kind}
          </label>
          <select id={`${id}-kind`} name="kind" className={form.select} defaultValue="note">
            {loggableKinds.map((kind) => (
              <option key={kind} value={kind}>
                {labels.kinds[kind]}
              </option>
            ))}
          </select>
        </div>
        {deals.length > 0 ? (
          <div className={form.field}>
            <label htmlFor={`${id}-deal`} className={form.label}>
              {labels.deal}
            </label>
            <select id={`${id}-deal`} name="dealId" className={form.select} defaultValue="">
              <option value="">{labels.noDeal}</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <Field
        control="textarea"
        name="body"
        label={labels.body}
        maxLength={activityBodyMax}
        rows={3}
        error={problem?.field === "body" ? problem.text : undefined}
      />
      <p className={form.feedback} data-tone="error" role="alert" hidden={general === ""}>
        {general}
      </p>
      <p className={form.feedback} data-tone="success" role="status">
        {done ? labels.done : ""}
      </p>
      <div className={form.actions}>
        <Button type="submit" variant="primary" loading={saving} loadingLabel={labels.saving}>
          {labels.submit}
        </Button>
      </div>
    </form>
  );
}
