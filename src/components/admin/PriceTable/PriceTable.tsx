"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { PriceState } from "@/components/ui/PriceState/PriceState";
import type {
  PriceActionHandler,
  PriceActionResult,
  PriceItem,
  PriceRowView,
  PriceTableLabels,
} from "@/types/prices";

import { PriceItemSheet } from "./PriceItemSheet";
import styles from "./PriceTable.module.css";

interface PriceTableProps {
  rows: PriceRowView[];
  labels: PriceTableLabels;
  save: PriceActionHandler;
  archive: PriceActionHandler;
  move: PriceActionHandler;
}

type Feedback = { tone: "success" | "error"; text: string } | null;

function describe(result: PriceActionResult, labels: PriceTableLabels, done: string): Feedback {
  if (result.status === "done") return { tone: "success", text: done };
  if (result.status === "invalid") {
    return { tone: "error", text: labels.actions.errors[result.field] };
  }
  return { tone: "error", text: labels.actions.errors[result.status] };
}

export function PriceTable({ rows, labels, save, archive, move }: PriceTableProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pending, startAction] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const table = rows[0]?.item.table;
  const editable = table === "extras" || table === "plans";
  const current = rows.find((row) => row.item.key === editing) ?? null;

  const run = (key: string, action: () => Promise<PriceActionResult>, done: string) => {
    if (pending) return;
    setFeedback(null);
    setBusyKey(key);
    startAction(async () => {
      const result = await action();
      setFeedback(describe(result, labels, done));
      setConfirming(null);
      setBusyKey(null);
    });
  };

  const onArchive = (item: PriceItem) => {
    run(
      item.key,
      () =>
        archive({
          table: item.table,
          key: item.key,
          expectedUpdatedAt: item.updatedAt,
          archived: !item.archived,
        }),
      item.archived ? labels.actions.done.restore : labels.actions.done.archive,
    );
  };

  const onMove = (item: PriceItem, direction: "up" | "down") => {
    run(
      item.key,
      () => move({ table: item.table, key: item.key, direction }),
      labels.actions.done.move,
    );
  };

  return (
    <>
      <div className={styles.region} role="region" aria-label={labels.region} tabIndex={0}>
        <table className={styles.table}>
          <caption className={styles.caption}>{labels.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{labels.columns.name}</th>
              <th scope="col">{labels.columns.price}</th>
              <th scope="col">{labels.columns.detail}</th>
              {editable ? <th scope="col">{labels.columns.visible}</th> : null}
              {editable ? <th scope="col">{labels.columns.status}</th> : null}
              <th scope="col">{labels.columns.actions}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const { item } = row;
              const busy = pending && busyKey === item.key;
              return (
                <tr key={item.key} data-archived={item.archived ? "true" : undefined}>
                  <th scope="row" className={styles.name}>
                    {row.name}
                    <span className={styles.key}>{item.key}</span>
                    <details className={styles.history}>
                      <summary className={styles.summary}>{labels.history}</summary>
                      {row.history.length === 0 ? (
                        <p className={styles.muted}>{labels.historyEmpty}</p>
                      ) : (
                        <ul className={styles.changes}>
                          {row.history.map((entry) => (
                            <li key={entry.id}>
                              {entry.text}
                              <span className={styles.meta}>{entry.meta}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </th>
                  <td>
                    {row.priceText === null ? (
                      <PriceState variant="review" label={labels.review} size="md" />
                    ) : (
                      <PriceState variant="final" amount={row.priceText} unit={row.unit} />
                    )}
                  </td>
                  <td>{row.detail}</td>
                  {editable ? <td>{item.visible ? labels.yes : labels.no}</td> : null}
                  {editable ? <td>{item.archived ? labels.archived : labels.active}</td> : null}
                  <td>
                    <div className={styles.actions}>
                      <Button
                        type="button"
                        variant="light"
                        size="sm"
                        aria-label={`${labels.edit}: ${row.name}`}
                        onClick={() => {
                          setEditing(item.key);
                        }}
                        disabled={pending}
                      >
                        {labels.edit}
                      </Button>
                      {editable ? (
                        <>
                          <Button
                            type="button"
                            variant="quiet"
                            size="sm"
                            aria-label={`${labels.moveUp}: ${row.name}`}
                            onClick={() => {
                              onMove(item, "up");
                            }}
                            disabled={pending || index === 0}
                          >
                            {labels.moveUp}
                          </Button>
                          <Button
                            type="button"
                            variant="quiet"
                            size="sm"
                            aria-label={`${labels.moveDown}: ${row.name}`}
                            onClick={() => {
                              onMove(item, "down");
                            }}
                            disabled={pending || index === rows.length - 1}
                          >
                            {labels.moveDown}
                          </Button>
                          {confirming === item.key ? (
                            <span className={styles.confirm} role="group" aria-label={row.name}>
                              <span>{labels.confirmArchive}</span>
                              <Button
                                type="button"
                                variant="quiet"
                                size="sm"
                                loading={busy}
                                loadingLabel={labels.confirmArchiveYes}
                                onClick={() => {
                                  onArchive(item);
                                }}
                              >
                                {labels.confirmArchiveYes}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setConfirming(null);
                                }}
                                disabled={pending}
                              >
                                {labels.sheet.cancel}
                              </Button>
                            </span>
                          ) : (
                            <Button
                              type="button"
                              variant="quiet"
                              size="sm"
                              aria-label={`${item.archived ? labels.restore : labels.archive}: ${row.name}`}
                              loading={busy}
                              loadingLabel={item.archived ? labels.restore : labels.archive}
                              onClick={() => {
                                if (item.archived) onArchive(item);
                                else setConfirming(item.key);
                              }}
                              disabled={pending}
                            >
                              {item.archived ? labels.restore : labels.archive}
                            </Button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p
        className={styles.feedback}
        data-tone={feedback?.tone}
        role={feedback?.tone === "error" ? "alert" : "status"}
      >
        {feedback?.text}
      </p>
      <PriceItemSheet
        item={current?.item ?? null}
        name={current?.name ?? ""}
        labels={labels.sheet}
        actionLabels={labels.actions}
        save={save}
        onClose={() => {
          setEditing(null);
        }}
        onSaved={(message) => {
          setEditing(null);
          setFeedback({ tone: "success", text: message });
        }}
      />
    </>
  );
}
