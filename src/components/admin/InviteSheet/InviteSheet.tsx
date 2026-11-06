"use client";

import { type SyntheticEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { InviteLink } from "@/components/admin/InviteLink/InviteLink";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import { formatEuro, previewBase, previewCommission, readRate } from "@/lib/admin/users";
import {
  type InviteActionResult,
  type InviteErrorCode,
  type InviteField,
  type InviteHandler,
  inviteNoteMax,
  inviteRoles,
  type InviteSheetLabels,
  payoutCadences,
} from "@/types/users";

import styles from "./InviteSheet.module.css";

interface InviteSheetProps {
  locale: string;
  labels: InviteSheetLabels;
  parents: { id: string; name: string }[];
  invite: InviteHandler;
  projectId?: string;
}

const initialValues = {
  email: "",
  role: "closer",
  parentCloserId: "",
  closerRate: "",
  parentRate: "",
  closerRecurringRate: "",
  parentRecurringRate: "",
  payoutCadence: "",
  note: "",
};

type Values = typeof initialValues;

interface Problem {
  field: InviteField | null;
  text: string;
}

const fieldOfCode: Partial<Record<InviteErrorCode, InviteField>> = {
  email_already_invited: "email",
  email_already_member: "email",
  invalid_parent_closer: "parentCloserId",
  rates_recurring_not_lower: "closerRecurringRate",
};

function problemOf(result: InviteActionResult, labels: InviteSheetLabels): Problem | null {
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  if (result.status === "error") {
    return { field: fieldOfCode[result.code] ?? null, text: labels.errors[result.code] };
  }
  return null;
}

export function InviteSheet({ locale, labels, parents, invite, projectId }: InviteSheetProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(() =>
    projectId === undefined ? initialValues : { ...initialValues, role: "client" },
  );
  const [problem, setProblem] = useState<Problem | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const doneHeading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const sub = values.role === "subcloser";
  const closerLike = sub || values.role === "closer";

  const preview = useMemo(
    () =>
      previewCommission(previewBase, {
        closer: readRate(values.closerRate),
        parent: sub ? readRate(values.parentRate) : null,
        closerRecurring: readRate(values.closerRecurringRate),
        parentRecurring: sub ? readRate(values.parentRecurringRate) : null,
      }),
    [values, sub],
  );

  useEffect(() => {
    if (path !== null) doneHeading.current?.focus();
  }, [path]);

  useEffect(() => {
    if (!pending && problem?.field)
      form.current?.querySelector<HTMLElement>(`[name="${problem.field}"]`)?.focus();
  }, [problem, pending]);

  const set =
    (name: keyof Values) =>
    (event: SyntheticEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value;
      setValues((current) => ({ ...current, [name]: value }));
    };

  const reset = () => {
    setValues(projectId === undefined ? initialValues : { ...initialValues, role: "client" });
    setProblem(null);
    setPath(null);
  };

  const close = () => {
    setOpen(false);
    if (path !== null) reset();
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    startTransition(async () => {
      const result = await invite({
        ...values,
        projectId: projectId ?? "",
        parentCloserId: sub ? values.parentCloserId : "",
        parentRate: sub ? values.parentRate : "",
        parentRecurringRate: sub ? values.parentRecurringRate : "",
        closerRate: closerLike ? values.closerRate : "",
        closerRecurringRate: closerLike ? values.closerRecurringRate : "",
        payoutCadence: closerLike ? values.payoutCadence : "",
      });
      if (result.status === "done") {
        setPath(result.path);
        return;
      }
      setProblem(problemOf(result, labels));
    });
  };

  const errorOf = (field: InviteField) => (problem?.field === field ? problem.text : undefined);
  const money = (value: number) => formatEuro(value, locale);
  const line = (
    template: string,
    amounts: { closer: number; parent: number | null } | null,
  ): string | null => {
    if (amounts === null) return null;
    const parent =
      amounts.parent === null
        ? ""
        : labels.previewParent.replace("{parent}", money(amounts.parent));
    return template
      .replace("{base}", money(previewBase))
      .replace("{closer}", money(amounts.closer))
      .replace("{parent}", parent);
  };
  const projectLine = line(labels.previewProject, preview.project);
  const recurringLine = line(labels.previewRecurring, preview.recurring);

  return (
    <>
      <Button
        variant="accent"
        onClick={() => {
          setOpen(true);
        }}
      >
        {labels.open}
      </Button>
      <Sheet open={open} onClose={close} title={labels.title} closeLabel={labels.close}>
        {path !== null ? (
          <div className={styles.done}>
            <h3 className={styles.doneTitle} tabIndex={-1} ref={doneHeading}>
              {labels.doneTitle}
            </h3>
            <p className={styles.text}>{labels.doneText}</p>
            <InviteLink
              path={path}
              label={labels.linkLabel}
              copyLabel={labels.copy}
              copiedLabel={labels.copied}
            />
            <div className={styles.actions}>
              <Button variant="light" onClick={reset}>
                {labels.another}
              </Button>
              <Button variant="quiet" onClick={close}>
                {labels.close}
              </Button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit} ref={form} noValidate>
            <Field
              name="email"
              label={labels.email}
              type="email"
              autoComplete="off"
              inputMode="email"
              value={values.email}
              onChange={set("email")}
              error={errorOf("email")}
              disabled={pending}
              required
            />
            {projectId === undefined ? (
              <Field
                control="select"
                name="role"
                label={labels.role}
                value={values.role}
                onChange={set("role")}
                error={errorOf("role")}
                disabled={pending}
              >
                {inviteRoles.map((role) => (
                  <option key={role} value={role}>
                    {labels.roles[role]}
                  </option>
                ))}
              </Field>
            ) : null}
            {sub ? (
              <Field
                control="select"
                name="parentCloserId"
                label={labels.parent}
                value={values.parentCloserId}
                onChange={set("parentCloserId")}
                error={errorOf("parentCloserId")}
                hint={parents.length === 0 ? labels.noParents : undefined}
                disabled={pending}
              >
                <option value="">{labels.parentPlaceholder}</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </Field>
            ) : null}
            {closerLike ? (
              <fieldset className={styles.rates} disabled={pending}>
                <legend className={styles.legend}>{labels.rates}</legend>
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
                  />
                  <Field
                    name="closerRecurringRate"
                    label={labels.closerRecurringRate}
                    inputMode="decimal"
                    autoComplete="off"
                    value={values.closerRecurringRate}
                    onChange={set("closerRecurringRate")}
                    error={errorOf("closerRecurringRate")}
                  />
                  {sub ? (
                    <>
                      <Field
                        name="parentRate"
                        label={labels.parentRate}
                        inputMode="decimal"
                        autoComplete="off"
                        value={values.parentRate}
                        onChange={set("parentRate")}
                        error={errorOf("parentRate")}
                      />
                      <Field
                        name="parentRecurringRate"
                        label={labels.parentRecurringRate}
                        inputMode="decimal"
                        autoComplete="off"
                        value={values.parentRecurringRate}
                        onChange={set("parentRecurringRate")}
                        error={errorOf("parentRecurringRate")}
                      />
                    </>
                  ) : null}
                </div>
                {projectLine || recurringLine ? (
                  <div className={styles.preview} role="group" aria-label={labels.preview}>
                    {projectLine ? <p>{projectLine}</p> : null}
                    {recurringLine ? <p>{recurringLine}</p> : null}
                  </div>
                ) : null}
              </fieldset>
            ) : null}
            {closerLike ? (
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
            ) : null}
            <Field
              control="textarea"
              name="note"
              label={labels.note}
              optionalLabel={labels.optional}
              rows={3}
              maxLength={inviteNoteMax}
              value={values.note}
              onChange={set("note")}
              error={errorOf("note")}
              disabled={pending}
            />
            {problem !== null && problem.field === null ? (
              <p className={styles.problem} role="alert">
                {problem.text}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="accent"
              loading={pending}
              loadingLabel={labels.submitting}
            >
              {labels.submit}
            </Button>
          </form>
        )}
      </Sheet>
    </>
  );
}
