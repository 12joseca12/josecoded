"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import type {
  PayoutInvoiceHandler,
  PayoutInvoiceLabels,
  PayoutInvoiceResult,
} from "@/types/payouts";

import form from "../admin-form.module.css";

interface PayoutInvoiceProps {
  id: string;
  hasInvoice: boolean;
  openHref: string;
  labels: PayoutInvoiceLabels;
  upload: PayoutInvoiceHandler;
}

function problemOf(result: PayoutInvoiceResult, labels: PayoutInvoiceLabels): string {
  if (result.status === "done") return "";
  if (result.status === "invalid") return labels.errors.file;
  return labels.errors[result.code];
}

export function PayoutInvoice({ id, hasInvoice, openHref, labels, upload }: PayoutInvoiceProps) {
  const announce = useAnnounce();
  const [problem, setProblem] = useState("");
  const [session, setSession] = useState(0);
  const [saving, startSaving] = useTransition();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    data.set("id", id);
    setProblem("");
    startSaving(async () => {
      const result = await upload(data);
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === "") {
        announce(labels.done);
        setSession((value) => value + 1);
      }
    });
  };

  const fileError =
    problem === labels.errors.file ||
    problem === labels.errors.fileType ||
    problem === labels.errors.fileSize
      ? problem
      : undefined;

  return (
    <section className={form.form} aria-labelledby={`invoice-${id}`}>
      <h2 id={`invoice-${id}`} className={form.previewTitle}>
        {labels.title}
      </h2>
      {hasInvoice ? (
        <p>
          <Button
            variant="light"
            size="sm"
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {labels.open}
          </Button>
        </p>
      ) : (
        <p className={form.note}>{labels.none}</p>
      )}
      <form key={session} className={form.form} onSubmit={onSubmit} noValidate>
        <Field
          name="file"
          type="file"
          accept="application/pdf"
          label={labels.upload}
          hint={labels.hint}
          error={fileError}
        />
        <p
          className={form.feedback}
          data-tone="error"
          role="alert"
          hidden={problem === "" || fileError !== undefined}
        >
          {fileError === undefined ? problem : ""}
        </p>
        <div className={form.actions}>
          <Button type="submit" variant="light" loading={saving} loadingLabel={labels.saving}>
            {labels.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}
