import Link from "next/link";

import { LeadStatus } from "@/components/admin/LeadStatus/LeadStatus";
import type { OwnLeadItem, OwnLeadsLabels } from "@/types/inbox";

import styles from "./OwnLeadList.module.css";

interface OwnLeadListProps {
  items: OwnLeadItem[];
  labels: OwnLeadsLabels;
  locale: string;
  people: Record<string, string> | null;
}

export function OwnLeadList({ items, labels, locale, people }: OwnLeadListProps) {
  return (
    <div className={styles.list}>
      <ul className={styles.cards} aria-label={labels.listLabel}>
        {items.map(({ row, dateText, offerText }) => {
          const owner = people && row.assigned_to ? people[row.assigned_to] : undefined;
          return (
            <li key={row.id} className={styles.card}>
              <div className={styles.head}>
                <span className={styles.name}>{row.full_name}</span>
                <LeadStatus status={row.status} label={labels.statuses[row.status]} />
              </div>
              <div className={styles.tags}>
                <span className={styles.tag}>{labels.vias[row.via ?? "none"]}</span>
                {offerText ? <span className={styles.tag}>{offerText}</span> : null}
              </div>
              <p className={styles.line}>{row.email ?? labels.noEmail}</p>
              {row.phone ? <p className={styles.line}>{row.phone}</p> : null}
              {owner ? (
                <p className={styles.muted}>{labels.assignedTo.replace("{name}", owner)}</p>
              ) : null}
              <time className={styles.date} dateTime={row.created_at}>
                {dateText}
              </time>
              <div className={styles.actions}>
                {row.contact_id ? (
                  <Link
                    className={styles.link}
                    href={`/${locale}/crm/contactos/${row.contact_id}`}
                    aria-label={labels.openContactAria.replace("{name}", row.full_name)}
                  >
                    {labels.openContact}
                  </Link>
                ) : (
                  <span className={styles.muted}>{labels.noContact}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
