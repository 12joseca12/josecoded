import { formatDay, invitationStatus } from "@/lib/admin/users";
import type { InvitationHandler, InvitationListLabels, InvitationRow } from "@/types/users";

import { InvitationActions } from "./InvitationActions";
import styles from "./InvitationList.module.css";

interface InvitationListProps {
  rows: InvitationRow[];
  inviters: Map<string, string>;
  locale: string;
  labels: InvitationListLabels;
  renew: InvitationHandler;
  revoke: InvitationHandler;
}

export function InvitationList({
  rows,
  inviters,
  locale,
  labels,
  renew,
  revoke,
}: InvitationListProps) {
  return (
    <div className={styles.region} role="region" aria-label={labels.region} tabIndex={0}>
      <table className={styles.table}>
        <caption className={styles.caption}>{labels.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.columns.email}</th>
            <th scope="col">{labels.columns.role}</th>
            <th scope="col">{labels.columns.by}</th>
            <th scope="col">{labels.columns.expires}</th>
            <th scope="col">{labels.columns.status}</th>
            <th scope="col">{labels.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = invitationStatus(row);
            const reopenable = status === "pending" || status === "expired";
            return (
              <tr key={row.id}>
                <th scope="row" className={styles.email}>
                  {row.email}
                </th>
                <td>{row.parent_closer_id ? labels.subcloser : labels.roles[row.role]}</td>
                <td>
                  {row.invited_by
                    ? (inviters.get(row.invited_by) ?? labels.unknownInviter)
                    : labels.unknownInviter}
                </td>
                <td>
                  <time dateTime={row.expires_at} className={styles.date}>
                    {formatDay(row.expires_at, locale)}
                  </time>
                </td>
                <td>
                  <span className={styles.status} data-status={status}>
                    {labels.status[status]}
                  </span>
                </td>
                <td>
                  {reopenable ? (
                    <InvitationActions
                      invitationId={row.id}
                      labels={labels.actions}
                      renew={renew}
                      revoke={revoke}
                    />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
