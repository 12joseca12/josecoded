"use client";

import Link from "next/link";
import { type SyntheticEvent, useEffect, useId, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import {
  type LeadAssignee,
  leadVias,
  manualLeadSources,
  type NewLeadField,
  type NewLeadHandler,
  type NewLeadLabels,
} from "@/types/leads";

import styles from "./NewLeadSheet.module.css";

interface NewLeadSheetProps {
  labels: NewLeadLabels;
  assignees: LeadAssignee[];
  create: NewLeadHandler;
  detailBase: string;
}

type Errors = Partial<Record<NewLeadField | "form", string>>;

function textOf(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function orNull(value: string): string | null {
  return value === "" ? null : value;
}

export function NewLeadSheet({ labels, assignees, create, detailBase }: NewLeadSheetProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [created, setCreated] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const closers = assignees.filter((entry) => entry.assignable);
  const close = () => {
    setOpen(false);
  };

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const fullName = textOf(data, "fullName");
    const email = orNull(textOf(data, "email"));
    const phone = orNull(textOf(data, "phone"));
    const next: Errors = {};
    if (fullName === "") next.fullName = labels.errors.fullName;
    if (email === null && phone === null) next.email = labels.errors.reachable;
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    start(async () => {
      const result = await create({
        source: textOf(data, "source"),
        via: orNull(textOf(data, "via")),
        fullName,
        email,
        phone,
        organization: orNull(textOf(data, "organization")),
        message: orNull(textOf(data, "message")),
        assignedTo: orNull(textOf(data, "assignedTo")),
      });
      if (result.status === "done") {
        form.current?.reset();
        setCreated(result.id);
        setOpen(false);
        return;
      }
      if (result.status === "invalid") {
        const fields: Errors = {};
        for (const field of result.fields) {
          fields[field] = field === "email" ? labels.errors.reachable : labels.errors[field];
        }
        setErrors(fields);
        return;
      }
      setErrors({ form: labels.errors[result.status] });
    });
  };

  return (
    <div className={styles.root}>
      <Button
        type="button"
        variant="accent"
        size="sm"
        aria-haspopup="dialog"
        onClick={() => {
          setCreated(null);
          setOpen(true);
        }}
      >
        {labels.open}
      </Button>
      <p className={styles.notice} role="status">
        {created ? (
          <>
            {labels.done}{" "}
            <Link className={styles.link} href={`${detailBase}/${created}`}>
              {labels.detail}
            </Link>
          </>
        ) : null}
      </p>
      <dialog
        ref={dialog}
        className={styles.sheet}
        aria-labelledby={`${id}-title`}
        onClose={() => {
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <form ref={form} className={styles.inner} onSubmit={onSubmit} noValidate>
          <div className={styles.head}>
            <h2 className={styles.title} id={`${id}-title`}>
              {labels.title}
            </h2>
            <IconButton
              label={labels.close}
              onClick={() => {
                setOpen(false);
              }}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </IconButton>
          </div>
          <div className={styles.pair}>
            <div className={styles.select}>
              <label className={styles.label} htmlFor={`${id}-source`}>
                {labels.source}
              </label>
              <select id={`${id}-source`} name="source" defaultValue="manual" disabled={pending}>
                {manualLeadSources.map((source) => (
                  <option key={source} value={source}>
                    {labels.sources[source]}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.select}>
              <label className={styles.label} htmlFor={`${id}-via`}>
                {labels.via}
              </label>
              <select id={`${id}-via`} name="via" defaultValue="" disabled={pending}>
                <option value="">{labels.viaNone}</option>
                {leadVias.map((via) => (
                  <option key={via} value={via}>
                    {labels.vias[via]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Field
            name="fullName"
            label={labels.fullName}
            error={errors.fullName}
            autoComplete="off"
            maxLength={200}
            disabled={pending}
          />
          <div className={styles.pair}>
            <Field
              name="email"
              type="email"
              label={labels.email}
              optionalLabel={labels.optional}
              error={errors.email}
              autoComplete="off"
              maxLength={320}
              disabled={pending}
            />
            <Field
              name="phone"
              type="tel"
              label={labels.phone}
              optionalLabel={labels.optional}
              error={errors.phone}
              autoComplete="off"
              maxLength={40}
              disabled={pending}
            />
          </div>
          <Field
            name="organization"
            label={labels.organization}
            optionalLabel={labels.optional}
            error={errors.organization}
            autoComplete="off"
            maxLength={200}
            disabled={pending}
          />
          <Field
            control="textarea"
            name="message"
            label={labels.message}
            optionalLabel={labels.optional}
            error={errors.message}
            maxLength={4000}
            disabled={pending}
          />
          <div className={styles.select}>
            <label className={styles.label} htmlFor={`${id}-assignedTo`}>
              {labels.assignedTo}
            </label>
            <select id={`${id}-assignedTo`} name="assignedTo" defaultValue="" disabled={pending}>
              <option value="">{labels.assignedNone}</option>
              {closers.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            {errors.assignedTo ? (
              <span className={styles.error} role="alert">
                {errors.assignedTo}
              </span>
            ) : null}
          </div>
          <p className={styles.error} role="alert">
            {errors.form}
          </p>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            loadingLabel={labels.submitting}
          >
            {labels.submit}
          </Button>
        </form>
      </dialog>
    </div>
  );
}
