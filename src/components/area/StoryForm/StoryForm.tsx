"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import {
  type StoryActionResult,
  storyCriteriaMax,
  type StoryDraft,
  type StoryField,
} from "@/types/area";

import styles from "./StoryForm.module.css";

export interface StoryFormLabels {
  title: string;
  titleHint: string;
  asA: string;
  asAHint: string;
  iWant: string;
  soThat: string;
  criteria: string;
  criteriaHint: string;
  criterion: string;
  addCriterion: string;
  removeCriterion: string;
  submit: string;
  submitting: string;
  cancel: string;
  errors: Record<StoryField | "forbidden" | "stale" | "error", string>;
}

interface StoryFormProps {
  initial: StoryDraft;
  labels: StoryFormLabels;
  submit: (draft: StoryDraft) => Promise<StoryActionResult>;
  successHref: string;
  cancelHref: string;
}

type Problem = { field: StoryField | null; text: string } | null;

let rowKey = 0;
const nextKey = () => `criterion-${(rowKey += 1)}`;

export function StoryForm({ initial, labels, submit, successHref, cancelHref }: StoryFormProps) {
  const router = useRouter();
  const [rows, setRows] = useState(() =>
    initial.criteria.map((value) => ({ key: nextKey(), value })),
  );
  const [problem, setProblem] = useState<Problem>(null);
  const [saving, startSaving] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const focusRow = (index: number) => {
    requestAnimationFrame(() => {
      const form = formRef.current;
      if (!form) return;
      const inputs = form.querySelectorAll<HTMLInputElement>("[data-criterion]");
      const target = inputs[Math.min(index, inputs.length - 1)];
      if (target) target.focus();
      else form.querySelector<HTMLElement>("[data-add]")?.focus();
    });
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => {
      const value = data.get(name);
      return typeof value === "string" ? value : "";
    };
    const draft: StoryDraft = {
      title: text("title"),
      asA: text("asA"),
      iWant: text("iWant"),
      soThat: text("soThat"),
      criteria: rows.map((row) => row.value),
    };
    setProblem(null);
    startSaving(async () => {
      const result = await submit(draft);
      if (result.status === "done") {
        router.push(successHref);
        return;
      }
      if (result.status === "invalid") {
        setProblem({ field: result.field, text: labels.errors[result.field] });
        requestAnimationFrame(() => {
          const target = formRef.current?.querySelector<HTMLElement>(`[name="${result.field}"]`);
          (target ?? formRef.current?.querySelector<HTMLElement>("[data-criterion]"))?.focus();
        });
        return;
      }
      setProblem({ field: null, text: labels.errors[result.status] });
    });
  };

  const errorOf = (field: StoryField) => (problem?.field === field ? problem.text : undefined);

  return (
    <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
      <Field
        name="title"
        label={labels.title}
        hint={labels.titleHint}
        defaultValue={initial.title}
        maxLength={200}
        error={errorOf("title")}
        autoComplete="off"
      />
      <Field
        name="asA"
        label={labels.asA}
        hint={labels.asAHint}
        defaultValue={initial.asA}
        maxLength={500}
        error={errorOf("asA")}
        autoComplete="off"
      />
      <Field
        name="iWant"
        label={labels.iWant}
        control="textarea"
        rows={2}
        defaultValue={initial.iWant}
        maxLength={500}
        error={errorOf("iWant")}
      />
      <Field
        name="soThat"
        label={labels.soThat}
        control="textarea"
        rows={2}
        defaultValue={initial.soThat}
        maxLength={500}
        error={errorOf("soThat")}
      />
      <fieldset className={styles.criteria}>
        <legend className={styles.legend}>{labels.criteria}</legend>
        <p className={styles.hint}>{labels.criteriaHint}</p>
        {rows.length > 0 ? (
          <ul className={styles.rows}>
            {rows.map((row, index) => (
              <li key={row.key} className={styles.row}>
                <div className={styles.rowField}>
                  <Field
                    name={`criterion-${row.key}`}
                    label={labels.criterion.replace("{n}", String(index + 1))}
                    value={row.value}
                    maxLength={500}
                    data-criterion=""
                    autoComplete="off"
                    onChange={(event) => {
                      setRows((current) =>
                        current.map((entry) =>
                          entry.key === row.key ? { ...entry, value: event.target.value } : entry,
                        ),
                      );
                    }}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  onClick={() => {
                    setRows((current) => current.filter((entry) => entry.key !== row.key));
                    focusRow(index);
                  }}
                >
                  {labels.removeCriterion.replace("{n}", String(index + 1))}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {errorOf("criteria") ? (
          <p className={styles.error} role="alert">
            {errorOf("criteria")}
          </p>
        ) : null}
        <div>
          <Button
            data-add=""
            type="button"
            size="sm"
            variant="light"
            disabled={rows.length >= storyCriteriaMax}
            onClick={() => {
              setRows((current) => [...current, { key: nextKey(), value: "" }]);
              focusRow(rows.length);
            }}
          >
            {labels.addCriterion}
          </Button>
        </div>
      </fieldset>
      {problem?.field === null ? (
        <p className={styles.error} role="alert">
          {problem.text}
        </p>
      ) : null}
      <div className={styles.actions}>
        <Button type="submit" loading={saving} loadingLabel={labels.submitting}>
          {labels.submit}
        </Button>
        <Button href={cancelHref} variant="quiet">
          {labels.cancel}
        </Button>
      </div>
    </form>
  );
}
