import Link from "next/link";

import { formatLeadDate } from "@/lib/admin/leads";
import type { LeadActionHandler, LeadAssignee, LeadRow, LeadTableLabels } from "@/types/leads";

import { LeadStatus } from "../LeadStatus/LeadStatus";
import { LeadActions } from "./LeadActions";
import styles from "./LeadTable.module.css";

interface LeadTableProps {
  rows: LeadRow[];
  assignees: LeadAssignee[];
  locale: string;
  detailBase: string;
  labels: LeadTableLabels;
  assign: LeadActionHandler;
  discard: LeadActionHandler;
}

export function LeadTable({
  rows,
  assignees,
  locale,
  detailBase,
  labels,
  assign,
  discard,
}: LeadTableProps) {
  const names = new Map(assignees.map((entry) => [entry.id, entry.name]));
  return (
    <div className={styles.region} role="region" aria-label={labels.region} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{labels.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.columns.via}</th>
            <th scope="col">{labels.columns.name}</th>
            <th scope="col">{labels.columns.email}</th>
            <th scope="col">{labels.columns.organization}</th>
            <th scope="col">{labels.columns.source}</th>
            <th scope="col">{labels.columns.status}</th>
            <th scope="col">{labels.columns.assigned}</th>
            <th scope="col">{labels.columns.date}</th>
            <th scope="col">{labels.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                {labels.via[row.via ?? "none"]}
                {row.offer ? <span className={styles.offer}>{row.offer}</span> : null}
              </td>
              <th scope="row" className={styles.name}>
                <Link className={styles.link} href={`${detailBase}/${row.id}`}>
                  {row.full_name}
                </Link>
              </th>
              <td className={styles.email}>
                {row.email ?? <span className={styles.muted}>{labels.noEmail}</span>}
              </td>
              <td>
                {row.organization ?? <span className={styles.muted}>{labels.noOrganization}</span>}
              </td>
              <td>{labels.sources[row.source]}</td>
              <td>
                <LeadStatus status={row.status} label={labels.status[row.status]} />
              </td>
              <td>
                {row.assigned_to ? (
                  (names.get(row.assigned_to) ?? labels.unknownAssignee)
                ) : (
                  <span className={styles.muted}>{labels.unassigned}</span>
                )}
              </td>
              <td>
                <time dateTime={row.created_at} className={styles.date}>
                  {formatLeadDate(row.created_at, locale)}
                </time>
              </td>
              <td>
                <LeadActions
                  lead={row}
                  assignees={assignees}
                  labels={labels.actions}
                  assign={assign}
                  discard={discard}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
