import { isAuditTable } from "@/lib/admin/audit";
import { formatMadridStamp } from "@/lib/settings/madrid-time";
import type { AuditEntry, AuditListLabels } from "@/types/audit";

import styles from "./AuditList.module.css";

const colon = ": ";
const arrow = " → ";

interface AuditListProps {
  entries: AuditEntry[];
  labels: AuditListLabels;
  locale: string;
  variant?: "compact" | "full";
  showTable?: boolean;
}

function tableName(entry: AuditEntry, labels: AuditListLabels): string {
  return isAuditTable(entry.table) ? labels.tables[entry.table] : entry.table;
}

export function AuditList({
  entries,
  labels,
  locale,
  variant = "compact",
  showTable = true,
}: AuditListProps) {
  return (
    <ol className={styles.list} data-variant={variant} aria-label={labels.region}>
      {entries.map((entry) => (
        <li key={entry.id} className={styles.entry}>
          <p className={styles.head}>
            <time className={styles.when} dateTime={entry.at}>
              {formatMadridStamp(entry.at, locale)}
            </time>
            <span className={styles.who}>{entry.actor ?? labels.system}</span>
          </p>
          <p className={styles.what}>
            <span className={styles.kind} data-kind={entry.kind}>
              {labels.kinds[entry.kind]}
            </span>
            {showTable ? <span> {tableName(entry, labels)}</span> : null}
            {variant === "full" && entry.rowId ? (
              <span className={styles.record}>
                {" "}
                {labels.record.replace("{id}", entry.rowId.slice(0, 8))}
              </span>
            ) : null}
          </p>
          {entry.kind === "update" ? (
            entry.changes.length === 0 ? (
              <p className={styles.muted}>{labels.noChanges}</p>
            ) : (
              <ul className={styles.changes}>
                {entry.changes.map((change) => (
                  <li key={change.field}>
                    <code className={styles.field}>{change.field}</code>
                    {colon}
                    {change.before ?? labels.emptyValue}
                    {arrow}
                    {change.after ?? labels.emptyValue}
                  </li>
                ))}
                {entry.hiddenChanges > 0 ? (
                  <li className={styles.muted}>
                    {labels.moreChanges.replace("{count}", String(entry.hiddenChanges))}
                  </li>
                ) : null}
              </ul>
            )
          ) : null}
        </li>
      ))}
    </ol>
  );
}
