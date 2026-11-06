"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import { buildTemplate } from "@/lib/admin/payments";
import { centsToInput, formatCents, parseMoneyToCents } from "@/lib/money";
import { type ScheduleKind, scheduleKinds } from "@/types/money";
import type { ScheduleSheetLabels, SetScheduleHandler, SetScheduleResult } from "@/types/payments";

import form from "../admin-form.module.css";

export interface ScheduleDealOption {
  id: string;
  label: string;
  wonCents: number;
}

interface ScheduleSheetProps {
  deals: ScheduleDealOption[];
  labels: ScheduleSheetLabels;
  save: SetScheduleHandler;
  locale: string;
}

interface ItemDraft {
  label: string;
  kind: ScheduleKind;
  percent: string;
  amount: string;
  dueAt: string;
}

type Problem = { field: "deal" | "items" | null; text: string } | null;

function problemOf(result: SetScheduleResult, labels: ScheduleSheetLabels): Problem {
  if (result.status === "done") return null;
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  return { field: null, text: labels.errors[result.code] };
}

function emptyItem(label: string): ItemDraft {
  return { label, kind: "milestone", percent: "", amount: "", dueAt: "" };
}

export function ScheduleSheet({ deals, labels, save, locale }: ScheduleSheetProps) {
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [dealId, setDealId] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [problem, setProblem] = useState<Problem>(null);
  const [saving, startSaving] = useTransition();

  const deal = deals.find((entry) => entry.id === dealId);
  const names = labels.defaults;

  const applyTemplate = (template: "442" | "single") => {
    if (!deal) return;
    setItems(
      buildTemplate(template, deal.wonCents).map((entry) => ({
        label: names[entry.key],
        kind: "milestone",
        percent: String(entry.percent),
        amount: centsToInput(entry.amountCents),
        dueAt: "",
      })),
    );
  };

  const onOpen = () => {
    setSession((value) => value + 1);
    setDealId("");
    setItems([]);
    setProblem(null);
    setOpen(true);
  };

  const patchItem = (index: number, changes: Partial<ItemDraft>) => {
    setItems((previous) =>
      previous.map((item, position) => (position === index ? { ...item, ...changes } : item)),
    );
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!deal) {
      setProblem({ field: "deal", text: labels.errors.deal });
      return;
    }
    setProblem(null);
    startSaving(async () => {
      const result = await save({ dealId: deal.id, items });
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === null) {
        announce(labels.done);
        setOpen(false);
      }
    });
  };

  const milestoneCents = items
    .filter((item) => item.kind === "milestone")
    .reduce((sum, item) => sum + (parseMoneyToCents(item.amount) ?? 0), 0);
  const general = problem?.field === "deal" ? "" : (problem?.text ?? "");
  const matches = milestoneCents === deal?.wonCents;

  return (
    <>
      <Button variant="light" onClick={onOpen}>
        {labels.open}
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
            value={dealId}
            onChange={(event) => {
              setDealId(event.target.value);
              setItems([]);
            }}
            error={problem?.field === "deal" ? problem.text : undefined}
          >
            <option value="">{labels.dealPlaceholder}</option>
            {deals.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </Field>
          {deal ? (
            <>
              <p className={form.note}>
                {labels.won.replace("{amount}", formatCents(deal.wonCents, locale))}
              </p>
              <div className={form.templates} role="group" aria-label={labels.templates}>
                <Button
                  variant="quiet"
                  size="sm"
                  type="button"
                  onClick={() => {
                    applyTemplate("442");
                  }}
                >
                  {labels.template442}
                </Button>
                <Button
                  variant="quiet"
                  size="sm"
                  type="button"
                  onClick={() => {
                    applyTemplate("single");
                  }}
                >
                  {labels.templateSingle}
                </Button>
              </div>
              <ol className={form.items} aria-label={labels.items}>
                {items.map((item, index) => (
                  <li key={`${String(session)}-${String(index)}`} className={form.item}>
                    <Field
                      name={`label-${String(index)}`}
                      label={labels.label}
                      maxLength={120}
                      value={item.label}
                      onChange={(event) => {
                        patchItem(index, { label: event.target.value });
                      }}
                    />
                    <div className={form.row}>
                      <Field
                        control="select"
                        name={`kind-${String(index)}`}
                        label={labels.kind}
                        value={item.kind}
                        onChange={(event) => {
                          patchItem(index, { kind: event.target.value as ScheduleKind });
                        }}
                      >
                        {scheduleKinds.map((kind) => (
                          <option key={kind} value={kind}>
                            {labels.kinds[kind]}
                          </option>
                        ))}
                      </Field>
                      <Field
                        name={`amount-${String(index)}`}
                        label={labels.amount}
                        inputMode="decimal"
                        autoComplete="off"
                        value={item.amount}
                        onChange={(event) => {
                          patchItem(index, { amount: event.target.value, percent: "" });
                        }}
                      />
                      <Field
                        name={`due-${String(index)}`}
                        type="date"
                        label={labels.due}
                        value={item.dueAt}
                        onChange={(event) => {
                          patchItem(index, { dueAt: event.target.value });
                        }}
                      />
                    </div>
                    <div>
                      <Button
                        variant="quiet"
                        size="sm"
                        type="button"
                        aria-label={labels.removeAria.replace("{position}", String(index + 1))}
                        onClick={() => {
                          setItems((previous) =>
                            previous.filter((_, position) => position !== index),
                          );
                        }}
                      >
                        {labels.remove}
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
              <div>
                <Button
                  variant="light"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setItems((previous) => [...previous, emptyItem(names.next)]);
                  }}
                >
                  {labels.add}
                </Button>
              </div>
              <p className={form.sum} data-state={matches ? "on" : "off"} aria-live="polite">
                {matches
                  ? labels.sumOk
                  : labels.sum
                      .replace("{sum}", formatCents(milestoneCents, locale))
                      .replace("{total}", formatCents(deal.wonCents, locale))}
              </p>
              <p className={form.note}>{labels.replaceNote}</p>
            </>
          ) : null}
          <p className={form.feedback} data-tone="error" role="alert" hidden={general === ""}>
            {general}
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
