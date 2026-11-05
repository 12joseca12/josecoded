"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import { centsToInput } from "@/lib/money";
import {
  type CommissionNature,
  commissionNatures,
  type PaymentKind,
  paymentKinds,
  type PaymentMethod,
  paymentMethods,
} from "@/types/money";
import type {
  RecordPaymentHandler,
  RecordPaymentLabels,
  RecordPaymentResult,
} from "@/types/payments";

import form from "../admin-form.module.css";

export interface PaymentDealOption {
  id: string;
  label: string;
}

export interface PaymentScheduleOption {
  id: string;
  dealId: string;
  label: string;
  nature: CommissionNature;
  remainingCents: number;
}

export interface PaymentInvoiceOption {
  id: string;
  dealId: string;
  label: string;
}

export interface PaymentPreset {
  dealId: string;
  scheduleId: string;
}

interface RecordPaymentSheetProps {
  deals: PaymentDealOption[];
  schedule: PaymentScheduleOption[];
  invoices: PaymentInvoiceOption[];
  labels: RecordPaymentLabels;
  record: RecordPaymentHandler;
  today: string;
  preset?: PaymentPreset;
  trigger: { text: string; aria?: string; variant: "primary" | "light"; size: "md" | "sm" };
}

interface Values {
  dealId: string;
  scheduleId: string;
  invoiceId: string;
  kind: PaymentKind;
  nature: CommissionNature;
  amount: string;
  receivedAt: string;
  method: PaymentMethod;
  reference: string;
}

type Problem = { field: "deal" | "amount" | "date" | null; text: string } | null;

function problemOf(result: RecordPaymentResult, labels: RecordPaymentLabels): Problem {
  if (result.status === "done") return null;
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  const field = result.code === "future_date" ? "date" : null;
  return { field, text: labels.errors[result.code] };
}

export function RecordPaymentSheet({
  deals,
  schedule,
  invoices,
  labels,
  record,
  today,
  preset,
  trigger,
}: RecordPaymentSheetProps) {
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [values, setValues] = useState<Values>(() => blank(preset, schedule, today));
  const [problem, setProblem] = useState<Problem>(null);
  const [saving, startSaving] = useTransition();

  const onOpen = () => {
    setSession((value) => value + 1);
    setValues(blank(preset, schedule, today));
    setProblem(null);
    setOpen(true);
  };

  const patch = (changes: Partial<Values>) => {
    setValues((previous) => ({ ...previous, ...changes }));
  };

  const onDeal = (dealId: string) => {
    patch({ dealId, scheduleId: "", invoiceId: "" });
  };

  const onSchedule = (scheduleId: string) => {
    const chosen = schedule.find((item) => item.id === scheduleId);
    patch({
      scheduleId,
      nature: chosen?.nature ?? values.nature,
      amount: chosen && values.amount === "" ? centsToInput(chosen.remainingCents) : values.amount,
    });
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setProblem(null);
    startSaving(async () => {
      const result = await record({
        dealId: values.dealId,
        scheduleId: values.scheduleId,
        invoiceId: values.invoiceId,
        kind: values.kind,
        nature: values.nature,
        amount: values.amount,
        receivedAt: values.receivedAt,
        method: values.method,
        reference: values.reference,
      });
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === null) {
        announce(labels.done);
        setOpen(false);
      }
    });
  };

  const dealSchedule = schedule.filter((item) => item.dealId === values.dealId);
  const dealInvoices = invoices.filter((item) => item.dealId === values.dealId);

  return (
    <>
      <Button
        variant={trigger.variant}
        size={trigger.size}
        aria-label={trigger.aria}
        onClick={onOpen}
      >
        {trigger.text}
      </Button>
      <ModalSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={labels.title}
        closeLabel={labels.close}
      >
        <form key={session} className={form.form} onSubmit={onSubmit} noValidate>
          <Field
            control="select"
            name="dealId"
            label={labels.deal}
            value={values.dealId}
            onChange={(event) => {
              onDeal(event.target.value);
            }}
            error={problem?.field === "deal" ? problem.text : undefined}
          >
            <option value="">{labels.dealPlaceholder}</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.label}
              </option>
            ))}
          </Field>
          <Field
            control="select"
            name="scheduleId"
            label={labels.schedule}
            value={values.scheduleId}
            onChange={(event) => {
              onSchedule(event.target.value);
            }}
          >
            <option value="">{labels.noSchedule}</option>
            {dealSchedule.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Field>
          <div className={form.row}>
            <Field
              control="select"
              name="kind"
              label={labels.kind}
              value={values.kind}
              onChange={(event) => {
                patch({ kind: event.target.value as PaymentKind });
              }}
            >
              {paymentKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {labels.kinds[kind]}
                </option>
              ))}
            </Field>
            <Field
              control="select"
              name="nature"
              label={labels.nature}
              value={values.nature}
              onChange={(event) => {
                patch({ nature: event.target.value as CommissionNature });
              }}
            >
              {commissionNatures.map((nature) => (
                <option key={nature} value={nature}>
                  {labels.natures[nature]}
                </option>
              ))}
            </Field>
          </div>
          <Field
            name="amount"
            label={labels.amount}
            hint={labels.amountHint}
            inputMode="decimal"
            autoComplete="off"
            value={values.amount}
            onChange={(event) => {
              patch({ amount: event.target.value });
            }}
            error={problem?.field === "amount" ? problem.text : undefined}
          />
          <div className={form.row}>
            <Field
              name="receivedAt"
              type="date"
              label={labels.date}
              max={today}
              value={values.receivedAt}
              onChange={(event) => {
                patch({ receivedAt: event.target.value });
              }}
              error={problem?.field === "date" ? problem.text : undefined}
            />
            <Field
              control="select"
              name="method"
              label={labels.method}
              value={values.method}
              onChange={(event) => {
                patch({ method: event.target.value as PaymentMethod });
              }}
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {labels.methods[method]}
                </option>
              ))}
            </Field>
          </div>
          <Field
            name="reference"
            label={labels.reference}
            optionalLabel={labels.optional}
            maxLength={200}
            autoComplete="off"
            value={values.reference}
            onChange={(event) => {
              patch({ reference: event.target.value });
            }}
          />
          <Field
            control="select"
            name="invoiceId"
            label={labels.invoice}
            optionalLabel={labels.optional}
            value={values.invoiceId}
            onChange={(event) => {
              patch({ invoiceId: event.target.value });
            }}
          >
            <option value="">{labels.noInvoice}</option>
            {dealInvoices.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Field>
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
    </>
  );
}

function blank(
  preset: PaymentPreset | undefined,
  schedule: PaymentScheduleOption[],
  today: string,
): Values {
  const chosen = preset ? schedule.find((item) => item.id === preset.scheduleId) : undefined;
  return {
    dealId: preset?.dealId ?? "",
    scheduleId: preset?.scheduleId ?? "",
    invoiceId: "",
    kind: "payment",
    nature: chosen?.nature ?? "project",
    amount: chosen ? centsToInput(chosen.remainingCents) : "",
    receivedAt: today,
    method: "transfer",
    reference: "",
  };
}
