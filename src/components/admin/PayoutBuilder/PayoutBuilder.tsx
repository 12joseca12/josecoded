"use client";

import { type SyntheticEvent, useEffect, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import { isValidPeriod, suggestPeriod } from "@/lib/crm/payout-periods";
import { formatCents } from "@/lib/money";
import type { PayoutCadence } from "@/types/money";
import type {
  BuildPayoutHandler,
  BuildPayoutResult,
  PayoutBuilderLabels,
  PreviewPayoutHandler,
  PreviewPayoutResult,
} from "@/types/payouts";

import form from "../admin-form.module.css";

export interface BuilderBeneficiary {
  id: string;
  name: string;
  role: "closer" | "freelance";
  cadence: PayoutCadence;
}

interface PayoutBuilderProps {
  beneficiaries: BuilderBeneficiary[];
  today: string;
  locale: string;
  preselectId?: string;
  labels: PayoutBuilderLabels;
  build: BuildPayoutHandler;
  preview: PreviewPayoutHandler;
}

type Problem = {
  field: "beneficiary" | "period" | "withholding" | null;
  text: string;
} | null;

function problemOf(result: BuildPayoutResult, labels: PayoutBuilderLabels): Problem {
  if (result.status === "done") return null;
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  const field =
    result.code === "invalid_period"
      ? "period"
      : result.code === "invalid_withholding"
        ? "withholding"
        : null;
  return { field, text: labels.errors[result.code] };
}

export function PayoutBuilder({
  beneficiaries,
  today,
  locale,
  preselectId,
  labels,
  build,
  preview,
}: PayoutBuilderProps) {
  const announce = useAnnounce();
  const preselected = beneficiaries.find((entry) => entry.id === preselectId);
  const initialPeriod = preselected ? suggestPeriod(preselected.cadence, today) : null;
  const [open, setOpen] = useState(preselected !== undefined);
  const [session, setSession] = useState(0);
  const [beneficiaryId, setBeneficiaryId] = useState(preselected?.id ?? "");
  const [start, setStart] = useState(initialPeriod?.start ?? "");
  const [end, setEnd] = useState(initialPeriod?.end ?? "");
  const [withholding, setWithholding] = useState("0");
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState<Problem>(null);
  const [outcome, setOutcome] = useState<PreviewPayoutResult | null>(null);
  const [saving, startSaving] = useTransition();

  const chosen = beneficiaries.find((entry) => entry.id === beneficiaryId);

  useEffect(() => {
    if (!open || !chosen || !isValidPeriod({ start, end })) {
      return;
    }
    let cancelled = false;
    void preview({ beneficiaryId: chosen.id, role: chosen.role, start, end }).then((result) => {
      if (!cancelled) setOutcome(result);
    });
    return () => {
      cancelled = true;
    };
  }, [open, chosen, start, end, preview]);

  const onBeneficiary = (id: string) => {
    setBeneficiaryId(id);
    setOutcome(null);
    const entry = beneficiaries.find((candidate) => candidate.id === id);
    if (entry) {
      const period = suggestPeriod(entry.cadence, today);
      setStart(period.start);
      setEnd(period.end);
    }
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!chosen) {
      setProblem({ field: "beneficiary", text: labels.errors.beneficiary });
      return;
    }
    setProblem(null);
    startSaving(async () => {
      const result = await build({ beneficiaryId: chosen.id, start, end, withholding, note });
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === null) {
        announce(labels.done);
        setOpen(false);
      }
    });
  };

  const ready = chosen !== undefined && isValidPeriod({ start, end });

  return (
    <>
      <Button
        variant="primary"
        onClick={() => {
          setSession((value) => value + 1);
          setBeneficiaryId("");
          setStart("");
          setEnd("");
          setWithholding("0");
          setNote("");
          setProblem(null);
          setOutcome(null);
          setOpen(true);
        }}
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
            control="select"
            name="beneficiaryId"
            label={labels.beneficiary}
            value={beneficiaryId}
            onChange={(event) => {
              onBeneficiary(event.target.value);
            }}
            error={problem?.field === "beneficiary" ? problem.text : undefined}
          >
            <option value="">{labels.placeholder}</option>
            {(["closer", "freelance"] as const).map((role) => {
              const group = beneficiaries.filter((entry) => entry.role === role);
              return group.length === 0 ? null : (
                <optgroup key={role} label={labels.roles[role]}>
                  {group.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </Field>
          {chosen ? (
            <p className={form.note}>
              {labels.suggested.replace("{cadence}", labels.cadences[chosen.cadence])}
            </p>
          ) : null}
          <div className={form.row}>
            <Field
              name="start"
              type="date"
              label={labels.start}
              value={start}
              onChange={(event) => {
                setStart(event.target.value);
                setOutcome(null);
              }}
              error={problem?.field === "period" ? problem.text : undefined}
            />
            <Field
              name="end"
              type="date"
              label={labels.end}
              value={end}
              onChange={(event) => {
                setEnd(event.target.value);
                setOutcome(null);
              }}
            />
            <Field
              name="withholding"
              label={labels.withholding}
              hint={labels.withholdingHint}
              inputMode="decimal"
              autoComplete="off"
              value={withholding}
              onChange={(event) => {
                setWithholding(event.target.value);
              }}
              error={problem?.field === "withholding" ? problem.text : undefined}
            />
          </div>
          <Field
            control="textarea"
            name="note"
            label={labels.note}
            optionalLabel={labels.optional}
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
            }}
          />
          <section className={form.preview} aria-labelledby={`preview-${String(session)}`}>
            <h3 id={`preview-${String(session)}`} className={form.previewTitle}>
              {labels.previewTitle}
            </h3>
            <div aria-live="polite">
              {!ready ? null : outcome === null ? (
                <p className={form.note}>{labels.previewLoading}</p>
              ) : outcome.status === "error" ? null : outcome.count === 0 ? (
                <p className={form.note}>{labels.previewEmpty}</p>
              ) : (
                <>
                  <p className={form.note}>
                    {labels.previewCount.replace("{count}", String(outcome.count))}
                  </p>
                  <p className={form.sum}>
                    {labels.previewTotal.replace(
                      "{amount}",
                      formatCents(outcome.totalCents, locale),
                    )}
                  </p>
                </>
              )}
            </div>
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
