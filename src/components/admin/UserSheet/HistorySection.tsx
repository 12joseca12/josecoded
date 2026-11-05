"use client";

import { useState, useTransition } from "react";

import { formatDay } from "@/lib/admin/users";
import type { HistoryEntry, HistoryHandler, UserSheetLabels } from "@/types/users-manage";

import styles from "./UserSheet.module.css";

interface HistorySectionProps {
  userId: string;
  locale: string;
  labels: UserSheetLabels;
  load: HistoryHandler;
}

type Loaded = { status: "ok"; entries: HistoryEntry[] } | { status: "error" } | null;

export function HistorySection({ userId, locale, labels, load }: HistorySectionProps) {
  const [loaded, setLoaded] = useState<Loaded>(null);
  const [pending, startTransition] = useTransition();

  const describeEntry = (entry: HistoryEntry): string => {
    if (entry.kind === "insert") return labels.historyInsert;
    if (entry.kind === "totp_reset") return labels.historyTotpReset;
    return entry.changes
      .map(
        (change) =>
          `${labels.historyFields[change.field]}: ${change.before ?? labels.historyEmptyValue} → ${change.after ?? labels.historyEmptyValue}`,
      )
      .join("; ");
  };

  return (
    <details
      className={styles.history}
      onToggle={(event) => {
        if (!event.currentTarget.open || loaded?.status === "ok" || pending) return;
        startTransition(async () => {
          setLoaded(await load({ userId }));
        });
      }}
    >
      <summary className={styles.summary}>{labels.historyTitle}</summary>
      <div className={styles.stack} aria-busy={pending}>
        {pending ? (
          <p className={styles.text} role="status">
            {labels.historyLoading}
          </p>
        ) : null}
        {loaded?.status === "error" ? (
          <p className={styles.feedback} data-tone="error" role="alert">
            {labels.errors.history}
          </p>
        ) : null}
        {loaded?.status === "ok" && loaded.entries.length === 0 ? (
          <p className={styles.text}>{labels.historyEmpty}</p>
        ) : null}
        {loaded?.status === "ok" && loaded.entries.length > 0 ? (
          <ol className={styles.timeline}>
            {loaded.entries.map((entry) => (
              <li key={entry.id}>
                <time dateTime={entry.at} className={styles.when}>
                  {formatDay(entry.at, locale)}
                </time>
                <span className={styles.who}> {entry.actor ?? labels.historyActorUnknown}</span>
                <span className={styles.what}>{describeEntry(entry)}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </details>
  );
}
