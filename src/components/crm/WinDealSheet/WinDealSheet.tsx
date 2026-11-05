"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import { previewCommission } from "@/lib/crm/commission-preview";
import { formatCents, formatRate, parseMoneyToCents } from "@/lib/money";
import type {
  CommissionPreview,
  WinDealHandler,
  WinDealResult,
  WinPreviewContext,
  WinSheetLabels,
} from "@/types/deal-win";

import form from "../sheet-form.module.css";
import styles from "./WinDealSheet.module.css";

interface WinDealSheetProps {
  dealId: string;
  contactName: string;
  context: WinPreviewContext;
  locale: string;
  labels: WinSheetLabels;
  win: WinDealHandler;
  onDone: (message: string) => void;
}

type Problem = { field: "wonAmount" | "recurringMonthly" | null; text: string } | null;

function problemOf(result: WinDealResult, labels: WinSheetLabels): Problem {
  if (result.status === "done") return null;
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  return { field: null, text: labels.errors[result.status] };
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function previewOf(
  context: WinPreviewContext,
  wonText: string,
  recurringText: string,
): CommissionPreview | null {
  const won = parseMoneyToCents(wonText);
  if (won === null || won <= 0) return null;
  const recurring = recurringText.trim() === "" ? null : parseMoneyToCents(recurringText);
  return previewCommission(context, won, recurring !== null && recurring > 0 ? recurring : null);
}

export function WinDealSheet({
  dealId,
  contactName,
  context,
  locale,
  labels,
  win,
  onDone,
}: WinDealSheetProps) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [wonText, setWonText] = useState("");
  const [recurringText, setRecurringText] = useState("");
  const [problem, setProblem] = useState<Problem>(null);
  const [saving, startSaving] = useTransition();

  const onOpen = () => {
    setSession((value) => value + 1);
    setWonText("");
    setRecurringText("");
    setProblem(null);
    setOpen(true);
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setProblem(null);
    startSaving(async () => {
      const result = await win({ dealId, wonAmount: wonText, recurringMonthly: recurringText });
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === null) {
        onDone(labels.done);
        setOpen(false);
      }
    });
  };

  const preview = previewOf(context, wonText, recurringText);

  return (
    <>
      <Button
        variant="light"
        size="sm"
        aria-label={labels.openAria.replace("{name}", contactName)}
        onClick={onOpen}
      >
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
            name="wonAmount"
            label={labels.wonAmount}
            hint={labels.wonAmountHint}
            inputMode="decimal"
            autoComplete="off"
            value={wonText}
            onChange={(event) => {
              setWonText(event.target.value);
            }}
            error={problem?.field === "wonAmount" ? problem.text : undefined}
          />
          <Field
            name="recurringMonthly"
            label={labels.recurring}
            hint={labels.recurringHint}
            optionalLabel={labels.optional}
            inputMode="decimal"
            autoComplete="off"
            value={recurringText}
            onChange={(event) => {
              setRecurringText(event.target.value);
            }}
            error={problem?.field === "recurringMonthly" ? problem.text : undefined}
          />
          <section className={styles.preview} aria-labelledby={`preview-${dealId}`}>
            <h3 id={`preview-${dealId}`} className={styles.previewTitle}>
              {labels.previewTitle}
            </h3>
            <div aria-live="polite" className={styles.previewBody}>
              {preview === null ? (
                <p className={styles.muted}>{labels.previewEmpty}</p>
              ) : preview.status === "none" ? (
                <p className={styles.muted}>{labels.noCommission[preview.reason]}</p>
              ) : (
                <>
                  <ul className={styles.lines}>
                    {preview.lines.map((line) => (
                      <li key={line.beneficiaryId} data-line={line.role}>
                        <span>
                          {line.beneficiaryName === null
                            ? fill(labels.previewParentAnonymous, {
                                rate: formatRate(line.rate, locale),
                                amount: formatCents(line.amountCents, locale),
                              })
                            : fill(labels.previewLine, {
                                name: line.beneficiaryName,
                                role:
                                  line.role === "parent" ? labels.parentRole : labels.closerRole,
                                rate: formatRate(line.rate, locale),
                                amount: formatCents(line.amountCents, locale),
                              })}
                        </span>
                        {line.recurringRate !== null && line.recurringMonthlyCents !== null ? (
                          <span className={styles.muted}>
                            {fill(labels.previewRecurring, {
                              rate: formatRate(line.recurringRate, locale),
                              amount: formatCents(line.recurringMonthlyCents, locale),
                            })}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <p className={styles.total}>
                    {fill(labels.previewTotal, { amount: formatCents(preview.totalCents, locale) })}
                  </p>
                </>
              )}
            </div>
            <p className={styles.muted}>{labels.freezeNote}</p>
          </section>
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
