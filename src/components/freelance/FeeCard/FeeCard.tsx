"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Heading } from "@/components/ui/Heading/Heading";
import { StatusPill } from "@/components/ui/StatusPill/StatusPill";
import { formatDay } from "@/lib/crm/contacts";
import { formatCents } from "@/lib/money";
import {
  type FeeCardLabels,
  type FeeErrorCode,
  type FeeItem,
  type FeeItemStatus,
  type FeeResult,
  type FeeSummary,
  type HoursHandler,
  type ItemHandler,
} from "@/types/freelance-fees";

import { HoursForm } from "../HoursForm/HoursForm";
import styles from "./FeeCard.module.css";

interface FeeCardProps {
  projectId: string;
  summary: FeeSummary | null;
  items: FeeItem[];
  locale: string;
  today: string;
  labels: FeeCardLabels;
  submitHours: HoursHandler;
  deliver: ItemHandler;
  remove: ItemHandler;
}

const separator = " · ";

function metaOf(item: FeeItem, locale: string, labels: FeeCardLabels): string {
  return [
    formatDay(item.worked_on, locale),
    item.hours === null ? null : fillLine(labels.hoursOf, { hours: String(item.hours) }),
    formatCents(item.amount, locale),
  ]
    .filter((part) => part !== null)
    .join(separator);
}

const tones: Record<FeeItemStatus, "neutral" | "done" | "alert" | "muted"> = {
  pending: "neutral",
  delivered: "neutral",
  approved: "done",
  rejected: "alert",
  paid: "muted",
};

export function fillLine(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

export function feeLine(summary: FeeSummary, locale: string, labels: FeeCardLabels): string {
  if (summary.mode === "fixed") {
    return fillLine(labels.fixed, { amount: formatCents(summary.amount ?? 0, locale) });
  }
  if (summary.mode === "hourly") {
    const base = fillLine(labels.hourly, { rate: formatCents(summary.hourly_rate ?? 0, locale) });
    return summary.hours_cap === null
      ? base
      : `${base} · ${fillLine(labels.hourlyCap, { hours: String(summary.hours_cap) })}`;
  }
  return labels.milestones;
}

export function FeeCard({
  projectId,
  summary,
  items,
  locale,
  today,
  labels,
  submitHours,
  deliver,
  remove,
}: FeeCardProps) {
  const router = useRouter();
  const announce = useAnnounce();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<FeeErrorCode | null>(null);

  if (summary === null) {
    return (
      <section className={styles.card} aria-labelledby="freelance-fee">
        <Heading level={2} size="h4" id="freelance-fee">
          {labels.title}
        </Heading>
        <p className={styles.muted}>{labels.none}</p>
      </section>
    );
  }

  const open = summary.closed_at === null;
  const run = (id: string, call: () => Promise<FeeResult>, done: string) => {
    if (pending) return;
    setError(null);
    setBusy(id);
    startTransition(async () => {
      let result: FeeResult;
      try {
        result = await call();
      } catch {
        result = { status: "error", code: "error" };
      }
      setBusy(null);
      if (result.status === "done") {
        announce(done);
        router.refresh();
        return;
      }
      setError(result.status === "error" ? result.code : "error");
      router.refresh();
    });
  };

  return (
    <section className={styles.card} aria-labelledby="freelance-fee">
      <Heading level={2} size="h4" id="freelance-fee">
        {labels.title}
      </Heading>
      <p className={styles.line}>
        <strong>{labels.modes[summary.mode]}</strong>
        {separator}
        {feeLine(summary, locale, labels)}
      </p>
      <p className={styles.owed} data-empty={summary.approved_unpaid_amount === 0 || undefined}>
        {fillLine(labels.owed, { amount: formatCents(summary.approved_unpaid_amount, locale) })}
      </p>
      {open ? null : <p className={styles.muted}>{labels.closedNote}</p>}
      <h3 className={styles.sub}>{labels.itemsTitle}</h3>
      {items.length === 0 ? (
        <p className={styles.muted}>{labels.noItems}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.main}>
                <p className={styles.name}>{item.label}</p>
                <p className={styles.meta}>{metaOf(item, locale, labels)}</p>
                {item.status === "rejected" && item.rejected_reason ? (
                  <p className={styles.reason}>
                    {fillLine(labels.rejectedReason, { reason: item.rejected_reason })}
                  </p>
                ) : null}
              </div>
              <StatusPill tone={tones[item.status]}>{labels.statuses[item.status]}</StatusPill>
              {open && item.status === "pending" && summary.mode !== "hourly" ? (
                <Button
                  variant="light"
                  size="sm"
                  loading={busy === item.id}
                  loadingLabel={labels.delivering}
                  disabled={pending}
                  onClick={() => {
                    run(item.id, () => deliver(item.id), labels.delivered);
                  }}
                >
                  {labels.deliver}
                </Button>
              ) : null}
              {open && item.status === "pending" && summary.mode === "hourly" ? (
                <Button
                  variant="quiet"
                  size="sm"
                  aria-label={fillLine(labels.deleteFor, { name: item.label })}
                  loading={busy === item.id}
                  loadingLabel={labels.deleting}
                  disabled={pending}
                  onClick={() => {
                    run(item.id, () => remove(item.id), labels.deletedItem);
                  }}
                >
                  {labels.deleteItem}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className={styles.feedback} role="alert">
        {error === null ? null : labels.errors[error]}
      </p>
      {open && summary.mode === "hourly" ? (
        <HoursForm projectId={projectId} today={today} labels={labels} submit={submitHours} />
      ) : null}
    </section>
  );
}
