import { getFormatter, getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';
import { canTransition, commissionTone, MONEY_FORMAT, rateDiffers } from '@/lib/crm/commissions';

import { OwnerBadge } from '../owner-badge';
import { CommissionActionButtons } from './commission-actions';
import styles from './commission-table.module.css';
import table from '../table-stack/crm-table.module.css';

import type { CommissionAction } from './commission-actions';
import type { CommissionRecord } from '@/lib/crm/commissions';
import type { Locale } from '@josecoded/types';

const ZONE = 'Europe/Madrid';

/**
 * One commission of K5. The percent is the one frozen when the row was created (Q21); when the closer's rate is
 * another today, a line of help says which, so a 8 % beside a 10 % profile does not look like a mistake. A rejection
 * shows its reason, which the closer reads too. The buttons exist only for what the status allows
 * (`canTransition`), and only the admin gets the column: a closer's row has no actions and no closer.
 *
 * The row itself can take the focus (`tabIndex=-1`): after an action the focus lands here, where the new status is.
 */
export async function CommissionRow({
  row,
  locale,
  admin,
}: {
  row: CommissionRecord;
  locale: Locale;
  admin: boolean;
}) {
  const [t, tStatus, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crmCommissions.table' }),
    getTranslations({ locale, namespace: 'crmCommissions.status' }),
    getFormatter({ locale }),
  ]);
  const day = (iso: string) => format.dateTime(new Date(iso), { day: 'numeric', month: 'short', timeZone: ZONE });
  const money = (value: number) => format.number(value, MONEY_FORMAT);
  const percent = (value: number) => format.number(value / 100, { style: 'percent', maximumFractionDigits: 2 });
  const tActions = await getTranslations({ locale, namespace: 'crmCommissions.actions' });

  const where = [row.organization, row.packCode, row.packOption].filter(Boolean).join(' · ');
  const allow = (['approve', 'reject', 'pay'] as const).filter((action) =>
    canTransition(row.status, action === 'pay' ? 'paid' : action === 'approve' ? 'approved' : 'rejected'),
  ) satisfies readonly CommissionAction[];
  const who = row.organization ?? row.contactName;

  return (
    <tr
      id={`commission-${row.id}`}
      role="row"
      tabIndex={-1}
      className={`${table.row} ${styles.row}`}
      data-status={row.status}
    >
      <td role="cell" data-col="main" className={table.cell}>
        <div className={table.main}>
          <strong>{row.contactName}</strong>
          <span className={where ? undefined : table.muted}>{where}</span>
        </div>
      </td>
      <td role="cell" data-col="meta" data-label={t('closed')} className={`${table.cell} ${table.num}`}>
        {day(row.closedAt)}
      </td>
      {admin ? (
        <td role="cell" data-col="meta" className={table.cell}>
          <OwnerBadge
            state={row.closerDisabled ? 'off' : 'assigned'}
            name={row.closerName}
            suffix={row.closerDisabled ? t('closerOff') : undefined}
          />
        </td>
      ) : null}
      <td role="cell" data-col="meta" data-label={t('charged')} className={`${table.cell} ${table.right}`}>
        {money(row.baseAmount)}
      </td>
      <td role="cell" data-col="meta" className={`${table.cell} ${table.right}`}>
        <span className={table.num}>{percent(row.percent)}</span>
        {rateDiffers(row) ? (
          <>
            {' '}
            <span className={`${styles.note} ${styles.rate}`}>{t('rateNow', { rate: percent(row.closerRate) })}</span>
          </>
        ) : null}
      </td>
      <td role="cell" data-col="meta" data-label={t('commission')} className={`${table.cell} ${table.right}`}>
        <strong className={styles.strong}>{money(row.amount)}</strong>
      </td>
      <td role="cell" data-col="status" className={table.cell}>
        <span className={styles.status}>
          <StatusBadge tone={commissionTone(row.status)}>{tStatus(row.status)}</StatusBadge>
          {row.status === 'rejected' && row.rejectedReason ? (
            <span className={styles.note}>{t('reason', { reason: row.rejectedReason })}</span>
          ) : null}
        </span>
      </td>
      <td role="cell" data-col="meta" data-label={t('paid')} className={`${table.cell} ${table.num}`}>
        {row.paidAt ? day(row.paidAt) : t('none')}
      </td>
      {admin ? (
        <td role="cell" className={`${table.cell} ${styles.act}`}>
          <CommissionActionButtons
            target={{
              id: row.id,
              closer: row.closerName,
              detail: [who, row.packCode].filter(Boolean).join(' · '),
              amount: row.amount,
              base: row.baseAmount,
              percent: row.percent,
            }}
            allow={allow}
            labels={{
              approve: { text: tActions('approve'), name: tActions('approveFor', { contact: row.contactName }) },
              reject: { text: tActions('reject'), name: tActions('rejectFor', { contact: row.contactName }) },
              pay: { text: tActions('pay'), name: tActions('payFor', { contact: row.contactName }) },
            }}
          />
        </td>
      ) : null}
    </tr>
  );
}
