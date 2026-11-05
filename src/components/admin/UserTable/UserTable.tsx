import { formatEuro, formatRate } from "@/lib/admin/users";
import type { UserRow, UserTableLabels } from "@/types/users";

import styles from "./UserTable.module.css";

interface UserTableProps {
  rows: UserRow[];
  locale: string;
  labels: UserTableLabels;
}

function ratesOf(row: UserRow, locale: string): string | null {
  const project = formatRate(row.closer_rate, locale);
  const recurring = formatRate(row.closer_recurring_rate, locale);
  if (project === null && recurring === null) return null;
  return [project ?? "—", recurring ?? "—"].join(" · ");
}

export function UserTable({ rows, locale, labels }: UserTableProps) {
  const names = new Map(rows.map((row) => [row.id, row.full_name]));
  return (
    <div className={styles.region} role="region" aria-label={labels.region} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{labels.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.columns.name}</th>
            <th scope="col">{labels.columns.role}</th>
            <th scope="col">{labels.columns.status}</th>
            <th scope="col">{labels.columns.parent}</th>
            <th scope="col">{labels.columns.rates}</th>
            <th scope="col">{labels.columns.cadence}</th>
            <th scope="col">{labels.columns.totp}</th>
            <th scope="col" className={styles.number}>
              {labels.columns.contacts}
            </th>
            <th scope="col" className={styles.number}>
              {labels.columns.deals}
            </th>
            <th scope="col" className={styles.number}>
              {labels.columns.pending}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = row.is_active && row.archived_at === null;
            const rates = ratesOf(row, locale);
            return (
              <tr key={row.id} data-inactive={active ? undefined : "true"}>
                <th scope="row" className={styles.name}>
                  {row.full_name}
                  <span className={styles.email}>{row.email ?? labels.none}</span>
                </th>
                <td>{row.parent_closer_id ? labels.subcloser : labels.roles[row.role]}</td>
                <td>
                  <span className={styles.status} data-active={active ? "true" : "false"}>
                    {active ? labels.active : labels.inactive}
                  </span>
                </td>
                <td>
                  {row.parent_closer_id
                    ? (names.get(row.parent_closer_id) ?? labels.none)
                    : labels.none}
                </td>
                <td className={styles.nowrap}>{rates ?? labels.none}</td>
                <td>{row.payout_cadence ? labels.cadences[row.payout_cadence] : labels.none}</td>
                <td>{row.has_totp ? labels.totpYes : labels.totpNo}</td>
                <td className={styles.number}>{row.contacts_count}</td>
                <td className={styles.number}>{row.open_deals}</td>
                <td className={styles.number}>{formatEuro(row.accrued_pending, locale)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
