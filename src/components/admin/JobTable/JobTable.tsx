"use client";

import Link from "next/link";
import { useState } from "react";

import { formatMadridStamp } from "@/lib/settings/madrid-time";
import {
  type JobActionHandler,
  type JobRow,
  type JobStatus,
  jobStatuses,
  type JobTableLabels,
} from "@/types/system";

import { JobActions } from "./JobActions";
import styles from "./JobTable.module.css";

interface JobTableProps {
  rows: JobRow[];
  filter: JobStatus | null;
  basePath: string;
  locale: string;
  labels: JobTableLabels;
  retry: JobActionHandler;
  cancel: JobActionHandler;
}

const errorPreview = 120;

function attemptsOf(row: JobRow): string {
  return `${row.attempts}/${row.max_attempts}`;
}

function previewOf(error: string): string {
  return `${error.slice(0, errorPreview)}… `;
}

export function JobTable({ rows, filter, basePath, locale, labels, retry, cancel }: JobTableProps) {
  const [message, setMessage] = useState("");
  const filters = [null, ...jobStatuses] as const;
  return (
    <div className={styles.wrapper}>
      <nav aria-label={labels.filterLabel}>
        <ul className={styles.filters}>
          {filters.map((entry) => (
            <li key={entry ?? "all"}>
              <Link
                className={styles.filter}
                href={entry ? `${basePath}?estado=${entry}` : basePath}
                aria-current={entry === filter ? "page" : undefined}
                scroll={false}
              >
                {labels.filters[entry ?? "all"]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className={styles.message} role="status">
        {message}
      </p>
      {rows.length > 0 ? (
        <div className={styles.region} role="region" aria-label={labels.region} tabIndex={0}>
          <table className={styles.table}>
            <caption className={styles.caption}>{labels.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{labels.columns.kind}</th>
                <th scope="col">{labels.columns.status}</th>
                <th scope="col">{labels.columns.attempts}</th>
                <th scope="col">{labels.columns.runAfter}</th>
                <th scope="col">{labels.columns.error}</th>
                <th scope="col">{labels.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row" className={styles.kind}>
                    {labels.kinds[row.kind]}
                  </th>
                  <td>
                    <span className={styles.status} data-status={row.status}>
                      {labels.status[row.status]}
                    </span>
                  </td>
                  <td className={styles.number}>{attemptsOf(row)}</td>
                  <td>
                    <time dateTime={row.run_after} className={styles.date}>
                      {formatMadridStamp(row.run_after, locale)}
                    </time>
                  </td>
                  <td className={styles.error}>
                    {row.error ? (
                      row.error.length > errorPreview ? (
                        <details>
                          <summary className={styles.summary}>
                            {previewOf(row.error)}
                            <span>{labels.errorMore}</span>
                          </summary>
                          <p className={styles.full}>{row.error}</p>
                        </details>
                      ) : (
                        row.error
                      )
                    ) : (
                      <span className={styles.muted}>{labels.noError}</span>
                    )}
                  </td>
                  <td>
                    <JobActions
                      job={row}
                      labels={labels}
                      retry={retry}
                      cancel={cancel}
                      onDone={setMessage}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
