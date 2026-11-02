import { getFormatter, getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';
import { isExpired, PERCENT_FORMAT } from '@/lib/team/team';

import { ConfirmSheet } from './team-sheets';
import styles from './team-table.module.css';
import table from '../../crm/table-stack/crm-table.module.css';

import type { TeamInvite } from '@/lib/team/team';
import type { Locale } from '@josecoded/types';

/**
 * The invitations not yet claimed, with resend (also for an expired one: it renews the link) and cancel (only while it
 * can still be used). The state is the date in words, «Caduca el…» or «Caducada el…», never colour alone.
 */
export async function InvitationTable({ invites, locale }: { invites: readonly TeamInvite[]; locale: Locale }) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'adminTeam.invitations' }), getFormatter({ locale })]);
  const tRoles = await getTranslations({ locale, namespace: 'adminTeam.table.roles' });
  return (
    <div className={`${table.box} ${styles.box}`} role="region" aria-label={t('caption')} tabIndex={0}>
      <table className={table.table} role="table">
        <caption className="sr-only">{t('caption')}</caption>
        <thead role="rowgroup" className={table.head}>
          <tr role="row">
            <th role="columnheader" scope="col" className={table.th}>{t('email')}</th>
            <th role="columnheader" scope="col" className={`${table.th} ${table.right}`}>{t('rate')}</th>
            <th role="columnheader" scope="col" className={table.th}>{t('status')}</th>
            <th role="columnheader" scope="col" className={table.th}>
              <span className="sr-only">{t('actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className={table.body}>
          {invites.map((invite) => {
            const expired = isExpired(invite);
            const date = format.dateTime(new Date(invite.expiresAt), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });
            const role = tRoles(invite.role);
            return (
              <tr key={invite.id} role="row" className={`${table.row} ${styles.row}`} data-off={expired || undefined}>
                <td role="cell" data-col="main" className={table.cell}>
                  <div className={table.main}>
                    <strong>{invite.email}</strong>
                    <span>{invite.note ? t('withNote', { role, note: invite.note }) : role}</span>
                  </div>
                </td>
                <td role="cell" data-col="meta" data-label={t('rate')} className={`${table.cell} ${table.right} ${table.num}`}>
                  {format.number(invite.rate / 100, PERCENT_FORMAT)}
                </td>
                <td role="cell" data-col="status" className={table.cell}>
                  <StatusBadge tone={expired ? 'muted' : 'attention'}>{t(expired ? 'expired' : 'expires', { date })}</StatusBadge>
                </td>
                <td role="cell" className={`${table.cell} ${styles.act}`}>
                  <ConfirmSheet kind="resend" id={invite.id} target={invite.email} />
                  {expired ? null : <ConfirmSheet kind="revoke" id={invite.id} target={invite.email} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
