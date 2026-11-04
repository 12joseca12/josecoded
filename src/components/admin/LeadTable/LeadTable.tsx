import { formatLeadDate } from "@/lib/admin/leads";
import type { LeadRow, LeadTableLabels } from "@/types/leads";

import styles from "./LeadTable.module.css";

interface LeadTableProps {
  rows: LeadRow[];
  locale: string;
  labels: LeadTableLabels;
}

export function LeadTable({ rows, locale, labels }: LeadTableProps) {
  return (
    <div className={styles.region} role="region" aria-label={labels.region} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{labels.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.columns.via}</th>
            <th scope="col">{labels.columns.name}</th>
            <th scope="col">{labels.columns.email}</th>
            <th scope="col">{labels.columns.status}</th>
            <th scope="col">{labels.columns.date}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{labels.via[row.via ?? "none"]}</td>
              <th scope="row" className={styles.name}>
                {row.full_name}
              </th>
              <td className={styles.email}>
                {row.email ?? <span className={styles.muted}>{labels.noEmail}</span>}
              </td>
              <td>
                <span className={styles.status} data-status={row.status}>
                  {labels.status[row.status]}
                </span>
              </td>
              <td>
                <time dateTime={row.created_at} className={styles.date}>
                  {formatLeadDate(row.created_at, locale)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
