import Link from "next/link";

import { formatDay, isOverdue } from "@/lib/crm/contacts";
import type { DueContact, DueListLabels } from "@/types/crm-overview";

import styles from "./DueList.module.css";

interface DueListProps {
  rows: DueContact[];
  labels: DueListLabels;
  locale: string;
  nowIso: string;
}

export function DueList({ rows, labels, locale, nowIso }: DueListProps) {
  return (
    <ul className={styles.list} aria-label={labels.listLabel}>
      {rows.map((row) => {
        const late = isOverdue(row.next_action_at, nowIso);
        return (
          <li key={row.id} className={styles.item}>
            <Link href={`/${locale}/crm/contactos/${row.id}`} className={styles.link}>
              {row.full_name}
            </Link>
            <span className={styles.action}>{row.next_action ?? labels.noAction}</span>
            <span className={styles.date} data-late={late || undefined}>
              {formatDay(row.next_action_at, locale)}
              {late ? ` · ${labels.overdue}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
