"use client";

import { type SyntheticEvent, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { payoutCadences, type UserRow } from "@/types/users";
import type { ManageHandler, RateField, UserSheetLabels } from "@/types/users-manage";

import { describe, Feedback, type FeedbackState } from "./Feedback";
import styles from "./UserSheet.module.css";

interface RatesSectionProps {
  user: UserRow;
  labels: UserSheetLabels;
  save: ManageHandler;
}

function text(value: number | null): string {
  return value === null ? "" : String(value);
}

export function RatesSection({ user, labels, save }: RatesSectionProps) {
  const [values, setValues] = useState({
    closerRate: text(user.closer_rate),
    closerRecurringRate: text(user.closer_recurring_rate),
    parentRate: text(user.parent_rate),
    parentRecurringRate: text(user.parent_recurring_rate),
    payoutCadence: user.payout_cadence ?? "",
  });
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [field, setField] = useState<RateField | null>(null);
  const [pending, startTransition] = useTransition();
  const child = user.parent_closer_id !== null;
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && field !== null) {
      form.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
    }
  }, [pending, field]);

  const set =
    (name: keyof typeof values) =>
    (event: SyntheticEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.currentTarget.value;
      setValues((current) => ({ ...current, [name]: value }));
    };

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setFeedback(null);
    setField(null);
    startTransition(async () => {
      const result = await save({
        userId: user.id,
        ...values,
        parentRate: child ? values.parentRate : "",
        parentRecurringRate: child ? values.parentRecurringRate : "",
      });
      setFeedback(describe(result, labels, labels.ratesSaved));
      if (result.status === "invalid" && result.field !== "userId") setField(result.field);
    });
  };

  const errorOf = (name: RateField) =>
    field === name && feedback?.tone === "error" ? feedback.text : undefined;

  return (
    <section className={styles.section} aria-labelledby={`rates-${user.id}`}>
      <h3 className={styles.sectionTitle} id={`rates-${user.id}`}>
        {labels.ratesTitle}
      </h3>
      {user.role !== "closer" ? (
        <p className={styles.text}>{labels.noRates}</p>
      ) : (
        <form className={styles.form} onSubmit={submit} ref={form} noValidate>
          <p className={styles.hint}>{labels.rateHint}</p>
          <div className={styles.grid}>
            <Field
              name="closerRate"
              label={labels.closerRate}
              inputMode="decimal"
              autoComplete="off"
              value={values.closerRate}
              onChange={set("closerRate")}
              error={errorOf("closerRate")}
              disabled={pending}
            />
            <Field
              name="closerRecurringRate"
              label={labels.closerRecurringRate}
              inputMode="decimal"
              autoComplete="off"
              value={values.closerRecurringRate}
              onChange={set("closerRecurringRate")}
              error={errorOf("closerRecurringRate")}
              disabled={pending}
            />
            {child ? (
              <>
                <Field
                  name="parentRate"
                  label={labels.parentRate}
                  inputMode="decimal"
                  autoComplete="off"
                  value={values.parentRate}
                  onChange={set("parentRate")}
                  error={errorOf("parentRate")}
                  disabled={pending}
                />
                <Field
                  name="parentRecurringRate"
                  label={labels.parentRecurringRate}
                  inputMode="decimal"
                  autoComplete="off"
                  value={values.parentRecurringRate}
                  onChange={set("parentRecurringRate")}
                  error={errorOf("parentRecurringRate")}
                  disabled={pending}
                />
              </>
            ) : null}
          </div>
          <Field
            control="select"
            name="payoutCadence"
            label={labels.cadence}
            value={values.payoutCadence}
            onChange={set("payoutCadence")}
            error={errorOf("payoutCadence")}
            disabled={pending}
          >
            <option value="">{labels.cadenceDefault}</option>
            {payoutCadences.map((cadence) => (
              <option key={cadence} value={cadence}>
                {labels.cadences[cadence]}
              </option>
            ))}
          </Field>
          <div className={styles.row}>
            <Button
              type="submit"
              variant="light"
              loading={pending}
              loadingLabel={labels.savingRates}
            >
              {labels.saveRates}
            </Button>
          </div>
          <Feedback
            state={field === null ? feedback : feedback?.tone === "success" ? feedback : null}
          />
        </form>
      )}
    </section>
  );
}
