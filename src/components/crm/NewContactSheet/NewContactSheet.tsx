"use client";

import { type SyntheticEvent, useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import {
  contactEmailMax,
  contactKinds,
  contactNameMax,
  contactPhoneMax,
  type NewContactField,
  type NewContactHandler,
  type NewContactLabels,
  type NewContactResult,
} from "@/types/crm";

import form from "../sheet-form.module.css";
import styles from "./NewContactSheet.module.css";

interface NewContactSheetProps {
  labels: NewContactLabels;
  create: NewContactHandler;
}

type Problem = { field: NewContactField | null; text: string } | null;

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function problemOf(result: NewContactResult, labels: NewContactLabels): Problem {
  if (result.status === "done") return null;
  if (result.status === "invalid") {
    return {
      field: result.field === "kind" ? null : result.field,
      text: labels.errors[result.field],
    };
  }
  if (result.status === "duplicate") return { field: "email", text: labels.errors.duplicate };
  return { field: null, text: labels.errors[result.status] };
}

export function NewContactSheet({ labels, create }: NewContactSheetProps) {
  const kindId = useId();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [problem, setProblem] = useState<Problem>(null);
  const [created, setCreated] = useState(false);
  const [saving, startSaving] = useTransition();

  const close = () => {
    setOpen(false);
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const element = event.currentTarget;
    const data = new FormData(element);
    const raw = {
      fullName: textOf(data, "fullName"),
      email: textOf(data, "email"),
      phone: textOf(data, "phone"),
      organization: textOf(data, "organization"),
      kind: textOf(data, "kind"),
    };
    setProblem(null);
    startSaving(async () => {
      const result = await create(raw);
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === null) {
        setCreated(true);
        setSession((value) => value + 1);
        setOpen(false);
        return;
      }
      if (next.field) {
        const control = element.elements.namedItem(next.field);
        if (control instanceof HTMLElement) control.focus();
      }
    });
  };

  return (
    <div className={styles.wrap}>
      <Button
        variant="accent"
        onClick={() => {
          setCreated(false);
          setProblem(null);
          setOpen(true);
        }}
      >
        {labels.open}
      </Button>
      <p className={styles.status} role="status">
        {created ? labels.done : ""}
      </p>
      <ModalSheet open={open} onClose={close} title={labels.title} closeLabel={labels.close}>
        <form key={session} className={form.form} onSubmit={onSubmit} noValidate>
          <Field
            name="fullName"
            label={labels.fullName}
            maxLength={contactNameMax}
            autoComplete="off"
            required
            error={problem?.field === "fullName" ? problem.text : undefined}
          />
          <Field
            name="email"
            type="email"
            label={labels.email}
            optionalLabel={labels.optional}
            maxLength={contactEmailMax}
            autoComplete="off"
            error={problem?.field === "email" ? problem.text : undefined}
          />
          <Field
            name="phone"
            type="tel"
            label={labels.phone}
            optionalLabel={labels.optional}
            maxLength={contactPhoneMax}
            autoComplete="off"
            error={problem?.field === "phone" ? problem.text : undefined}
          />
          <Field
            name="organization"
            label={labels.organization}
            optionalLabel={labels.optional}
            maxLength={contactNameMax}
            autoComplete="off"
            error={problem?.field === "organization" ? problem.text : undefined}
          />
          <div className={form.field}>
            <label htmlFor={kindId} className={form.label}>
              {labels.kind}
            </label>
            <select id={kindId} name="kind" className={form.select} defaultValue="prospect">
              {contactKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {labels.kinds[kind]}
                </option>
              ))}
            </select>
          </div>
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
    </div>
  );
}
