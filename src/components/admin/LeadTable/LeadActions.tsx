"use client";

import { type SyntheticEvent, useId, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import {
  discardReasonMax,
  type LeadActionHandler,
  type LeadActionLabels,
  type LeadActionResult,
  type LeadAssignee,
  type LeadRow,
} from "@/types/leads";

import styles from "./LeadActions.module.css";

interface LeadActionsProps {
  lead: LeadRow;
  assignees: LeadAssignee[];
  labels: LeadActionLabels;
  assign: LeadActionHandler;
  discard: LeadActionHandler;
}

type Feedback = { tone: "success" | "error"; text: string } | null;

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function describe(result: LeadActionResult, labels: LeadActionLabels, done: string): Feedback {
  if (result.status === "done") return { tone: "success", text: done };
  if (result.status === "invalid") return { tone: "error", text: labels.errors[result.field] };
  return { tone: "error", text: labels.errors[result.status] };
}

export function LeadActions({ lead, assignees, labels, assign, discard }: LeadActionsProps) {
  const id = useId();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [assigning, startAssign] = useTransition();
  const [discarding, startDiscard] = useTransition();
  const disclosure = useRef<HTMLDetailsElement>(null);
  const options = assignees.filter((entry) => entry.assignable);
  const open = lead.status !== "discarded";
  const busy = assigning || discarding;

  const onAssign = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const userId = textOf(data, "userId");
    if (userId === "") {
      setFeedback({ tone: "error", text: labels.errors.assignee });
      return;
    }
    setFeedback(null);
    startAssign(async () => {
      const result = await assign({ leadId: lead.id, userId });
      setFeedback(describe(result, labels, labels.done.assign));
    });
  };

  const onDiscard = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const reason = textOf(new FormData(event.currentTarget), "reason").trim();
    if (reason === "") {
      setFeedback({ tone: "error", text: labels.errors.reason });
      return;
    }
    setFeedback(null);
    startDiscard(async () => {
      const result = await discard({ leadId: lead.id, reason });
      setFeedback(describe(result, labels, labels.done.discard));
      if (result.status === "done" && disclosure.current) disclosure.current.open = false;
    });
  };

  return (
    <div className={styles.actions}>
      {open ? (
        <>
          {options.length === 0 ? (
            <p className={styles.muted}>{labels.noAssignees}</p>
          ) : (
            <form className={styles.row} onSubmit={onAssign} noValidate>
              <label className={styles.visually} htmlFor={`${id}-user`}>
                {labels.assignLabel}
              </label>
              <select
                id={`${id}-user`}
                name="userId"
                className={styles.select}
                defaultValue={lead.assigned_to ?? ""}
                disabled={busy}
              >
                <option value="">{labels.assignPlaceholder}</option>
                {options.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                variant="light"
                size="sm"
                loading={assigning}
                loadingLabel={labels.assigning}
                disabled={discarding}
              >
                {labels.assign}
              </Button>
            </form>
          )}
          <details className={styles.discard} ref={disclosure}>
            <summary className={styles.summary}>{labels.discardOpen}</summary>
            <form className={styles.row} onSubmit={onDiscard} noValidate>
              <label className={styles.visually} htmlFor={`${id}-reason`}>
                {labels.discardReasonLabel}
              </label>
              <input
                id={`${id}-reason`}
                name="reason"
                type="text"
                className={styles.input}
                placeholder={labels.discardReasonLabel}
                maxLength={discardReasonMax}
                autoComplete="off"
                disabled={busy}
              />
              <Button
                type="submit"
                variant="quiet"
                size="sm"
                loading={discarding}
                loadingLabel={labels.discarding}
                disabled={assigning}
              >
                {labels.discardSubmit}
              </Button>
            </form>
          </details>
        </>
      ) : lead.discard_reason ? (
        <p className={styles.muted}>
          {labels.reasonPrefix} {lead.discard_reason}
        </p>
      ) : null}
      <p
        className={styles.feedback}
        data-tone={feedback?.tone}
        role={feedback?.tone === "error" ? "alert" : "status"}
      >
        {feedback?.text}
      </p>
    </div>
  );
}
