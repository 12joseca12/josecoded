"use client";

import { type SyntheticEvent, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import {
  type ProjectActionResult,
  projectBriefMax,
  type ProjectField,
  type ProjectHandler,
  type ProjectOptions,
  type ProjectRow,
  type ProjectSheetLabels,
} from "@/types/admin-projects";

import styles from "./ProjectSheet.module.css";

interface ProjectSheetProps {
  mode: "create" | "edit";
  project?: ProjectRow;
  options: ProjectOptions;
  labels: ProjectSheetLabels;
  submit: ProjectHandler;
}

interface Values {
  name: string;
  dealId: string;
  offerSlug: string;
  freelanceId: string;
  startedAt: string;
  dueAt: string;
  brief: string;
}

function valuesOf(project: ProjectRow | undefined): Values {
  return {
    name: project?.name ?? "",
    dealId: "",
    offerSlug: project?.offer_slug ?? "",
    freelanceId: "",
    startedAt: project?.started_at ?? "",
    dueAt: project?.due_at ?? "",
    brief: "",
  };
}

interface Problem {
  field: ProjectField | null;
  text: string;
}

const fieldOfCode: Partial<Record<string, ProjectField>> = {
  deal_not_won: "dealId",
  deal_not_found: "dealId",
  contact_deal_mismatch: "dealId",
  offer_not_found: "offerSlug",
  invalid_freelance: "freelanceId",
  invalid_dates: "dueAt",
  invalid_name: "name",
};

function problemOf(result: ProjectActionResult, labels: ProjectSheetLabels): Problem | null {
  if (result.status === "invalid") {
    return { field: result.field, text: labels.errors[result.field] };
  }
  if (result.status === "error") {
    return { field: fieldOfCode[result.code] ?? null, text: labels.errors[result.code] };
  }
  return null;
}

export function ProjectSheet({ mode, project, options, labels, submit }: ProjectSheetProps) {
  const creating = mode === "create";
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(() => valuesOf(project));
  const [problem, setProblem] = useState<Problem | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!pending && problem?.field) {
      form.current?.querySelector<HTMLElement>(`[name="${problem.field}"]`)?.focus();
    }
  }, [problem, pending]);

  useEffect(() => {
    if (saved && creating) doneHeading.current?.focus();
  }, [saved, creating]);

  const set =
    (name: keyof Values) =>
    (event: SyntheticEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value;
      setSaved(false);
      setValues((current) => ({ ...current, [name]: value }));
    };

  const close = () => {
    setOpen(false);
    setProblem(null);
    if (creating && saved) {
      setValues(valuesOf(undefined));
      setSaved(false);
    }
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    setSaved(false);
    startTransition(async () => {
      const result = await submit(
        creating
          ? values
          : {
              id: project?.id,
              name: values.name,
              offerSlug: values.offerSlug,
              startedAt: values.startedAt,
              dueAt: values.dueAt,
            },
      );
      if (result.status === "done") {
        setSaved(true);
        return;
      }
      setProblem(problemOf(result, labels));
    });
  };

  const errorOf = (field: ProjectField) => (problem?.field === field ? problem.text : undefined);
  const generalError = problem !== null && problem.field === null ? problem.text : null;

  return (
    <>
      {creating ? (
        <Button
          variant="accent"
          onClick={() => {
            setOpen(true);
          }}
        >
          {labels.create}
        </Button>
      ) : (
        <Button
          variant="light"
          size="sm"
          aria-label={labels.editFor.replace("{name}", project?.name ?? "")}
          onClick={() => {
            setOpen(true);
          }}
        >
          {labels.edit}
        </Button>
      )}
      <Sheet
        open={open}
        onClose={close}
        title={creating ? labels.createTitle : labels.editTitle}
        closeLabel={labels.close}
      >
        {creating && saved ? (
          <div className={styles.form}>
            <h3 className={styles.doneTitle} tabIndex={-1} ref={doneHeading}>
              {labels.doneCreate}
            </h3>
            <div className={styles.actions}>
              <Button variant="light" onClick={close}>
                {labels.close}
              </Button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={onSubmit} ref={form} noValidate>
            <Field
              name="name"
              label={labels.name}
              autoComplete="off"
              value={values.name}
              onChange={set("name")}
              error={errorOf("name")}
              disabled={pending}
              required
            />
            {creating ? (
              <Field
                control="select"
                name="dealId"
                label={labels.deal}
                hint={labels.dealHint}
                value={values.dealId}
                onChange={set("dealId")}
                error={errorOf("dealId")}
                disabled={pending}
              >
                <option value="">{labels.dealNone}</option>
                {options.deals.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.label}
                  </option>
                ))}
              </Field>
            ) : null}
            <Field
              control="select"
              name="offerSlug"
              label={labels.offer}
              value={values.offerSlug}
              onChange={set("offerSlug")}
              error={errorOf("offerSlug")}
              disabled={pending}
            >
              <option value="">{labels.offerNone}</option>
              {options.offers.map((offer) => (
                <option key={offer.slug} value={offer.slug}>
                  {offer.name}
                </option>
              ))}
            </Field>
            {creating ? (
              <Field
                control="select"
                name="freelanceId"
                label={labels.freelance}
                value={values.freelanceId}
                onChange={set("freelanceId")}
                error={errorOf("freelanceId")}
                disabled={pending}
              >
                <option value="">{labels.freelanceNone}</option>
                {options.freelances.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Field>
            ) : null}
            <div className={styles.grid}>
              <Field
                name="startedAt"
                label={labels.startedAt}
                type="date"
                value={values.startedAt}
                onChange={set("startedAt")}
                error={errorOf("startedAt")}
                disabled={pending}
              />
              <Field
                name="dueAt"
                label={labels.dueAt}
                type="date"
                value={values.dueAt}
                onChange={set("dueAt")}
                error={errorOf("dueAt")}
                disabled={pending}
              />
            </div>
            {creating ? (
              <Field
                control="textarea"
                name="brief"
                label={labels.brief}
                hint={labels.briefHint}
                optionalLabel={labels.optional}
                rows={6}
                maxLength={projectBriefMax}
                value={values.brief}
                onChange={set("brief")}
                error={errorOf("brief")}
                disabled={pending}
              />
            ) : null}
            <div className={styles.actions}>
              <Button
                type="submit"
                variant="light"
                loading={pending}
                loadingLabel={labels.submitting}
              >
                {creating ? labels.submitCreate : labels.submitEdit}
              </Button>
            </div>
            <p
              className={styles.feedback}
              data-tone={generalError ? "error" : "success"}
              role={generalError ? "alert" : "status"}
            >
              {generalError ?? (saved ? labels.doneEdit : null)}
            </p>
          </form>
        )}
      </Sheet>
    </>
  );
}
