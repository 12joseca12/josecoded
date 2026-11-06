"use client";

import { type SyntheticEvent, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import {
  type LinkEditorLabels,
  type LinkField,
  linkNameMax,
  type LinkResult,
  linkUrlMax,
  linkUsageMax,
  projectLinkSchema,
} from "@/types/admin-project-team";

import styles from "./LinkEditor.module.css";

export interface LinkValues {
  name: string;
  url: string;
  usage: string;
}

interface LinkRowFormProps {
  mode: "add" | "edit";
  initial: LinkValues;
  labels: LinkEditorLabels;
  submit: (values: LinkValues) => Promise<LinkResult>;
  onDone: () => void;
  onCancel: () => void;
}

interface Problem {
  field: LinkField | null;
  text: string;
}

const fieldOfCode: Partial<Record<string, LinkField>> = {
  duplicate_url: "url",
  invalid_url: "url",
};

export function LinkRowForm({ mode, initial, labels, submit, onDone, onCancel }: LinkRowFormProps) {
  const [values, setValues] = useState<LinkValues>(initial);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    form.current?.querySelector<HTMLElement>('[name="name"]')?.focus();
  }, []);

  useEffect(() => {
    if (!pending && problem?.field) {
      form.current?.querySelector<HTMLElement>(`[name="${problem.field}"]`)?.focus();
    }
  }, [problem, pending]);

  const set = (name: keyof LinkValues) => (event: SyntheticEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    const checked = projectLinkSchema.safeParse(values);
    if (!checked.success) {
      const key = checked.error.issues[0]?.path[0];
      const field: LinkField = key === "url" || key === "usage" ? key : "name";
      setProblem({ field, text: labels.errors[field] });
      return;
    }
    startTransition(async () => {
      const result = await submit(values);
      if (result.status === "done") {
        onDone();
        return;
      }
      if (result.status === "invalid") {
        setProblem({ field: result.field, text: labels.errors[result.field] });
        return;
      }
      setProblem({ field: fieldOfCode[result.code] ?? null, text: labels.errors[result.code] });
    });
  };

  const errorOf = (field: LinkField) => (problem?.field === field ? problem.text : undefined);
  const generalError = problem !== null && problem.field === null ? problem.text : null;

  return (
    <form className={styles.form} onSubmit={onSubmit} ref={form} noValidate>
      <Field
        name="name"
        label={labels.form.name}
        autoComplete="off"
        maxLength={linkNameMax}
        value={values.name}
        onChange={set("name")}
        error={errorOf("name")}
        disabled={pending}
        required
      />
      <Field
        name="url"
        label={labels.form.url}
        hint={labels.form.urlHint}
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        maxLength={linkUrlMax}
        value={values.url}
        onChange={set("url")}
        error={errorOf("url")}
        disabled={pending}
        required
      />
      <Field
        name="usage"
        label={labels.form.usage}
        hint={labels.form.usageHint}
        optionalLabel={labels.form.optional}
        autoComplete="off"
        maxLength={linkUsageMax}
        value={values.usage}
        onChange={set("usage")}
        error={errorOf("usage")}
        disabled={pending}
      />
      <div className={styles.actions}>
        <Button
          type="submit"
          variant="light"
          loading={pending}
          loadingLabel={labels.form.submitting}
        >
          {mode === "add" ? labels.form.submitAdd : labels.form.submitEdit}
        </Button>
        <Button variant="quiet" disabled={pending} onClick={onCancel}>
          {labels.cancel}
        </Button>
      </div>
      <p className={styles.feedback} role="alert">
        {generalError}
      </p>
    </form>
  );
}
