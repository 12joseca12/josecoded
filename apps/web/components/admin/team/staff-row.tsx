import { getFormatter, getTranslations } from 'next-intl/server';

import { OwnerBadge } from '@/components/crm/owner-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Icon } from '@/components/ui/icon';
import { MONEY_FORMAT } from '@/lib/crm/commissions';
import { PERCENT_FORMAT } from '@/lib/team/team';

import { ReassignSheet } from './reassign-sheet';
import { ConfirmSheet, RateSheet } from './team-sheets';
import styles from './team-table.module.css';
import table from '../../crm/table-stack/crm-table.module.css';

import type { TeamMember } from '@/lib/team/team';
import type { Locale } from '@josecoded/types';

/**
 * One person of D1. The admin's own row has no actions (he does not reassign, price or deactivate himself) and no
 * rate. A deactivated closer keeps her row, muted, with her contacts «a su nombre» until they are reassigned, and
 * offers «Activar» in place of «Desactivar». TOTP is a verdict with text and icon, never colour alone.
 */
export async function StaffRow({
  member,
  targets,
  locale,
}: {
  member: TeamMember;
  targets: readonly { value: string; label: string }[];
  locale: Locale;
}) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'adminTeam.table' }), getFormatter({ locale })]);
  const { disabled, portfolio } = member;
  const closer = member.role === 'closer';
  const contacts = disabled && portfolio.all > 0 ? t('ownedByName', { count: portfolio.all }) : portfolio.all;

  return (
    <tr role="row" className={`${table.row} ${styles.row}`} data-off={disabled || undefined}>
      <td role="cell" data-col="main" className={`${table.cell} ${styles.personCell}`}>
        <span className={styles.person}>
          <OwnerBadge state={disabled ? 'off' : 'assigned'} name={member.name} />
          <span className={styles.email}>{member.email}</span>
        </span>
      </td>
      <td role="cell" data-col="meta" data-label={t('role')} className={table.cell}>
        {t(`roles.${member.role}`)}
      </td>
      <td role="cell" data-col="status" className={table.cell}>
        <StatusBadge tone={disabled ? 'muted' : 'live'}>{t(disabled ? 'off' : 'active')}</StatusBadge>
      </td>
      <td role="cell" data-col="meta" data-label={t('rate')} className={`${table.cell} ${table.right} ${table.num}`}>
        {member.rate === null ? t('none') : format.number(member.rate / 100, PERCENT_FORMAT)}
      </td>
      <td role="cell" data-col="meta" data-label={t('telegram')} className={table.cell}>
        <StatusBadge tone={member.telegram ? 'live' : 'muted'}>{t(member.telegram ? 'linked' : 'unlinked')}</StatusBadge>
      </td>
      <td role="cell" data-col="meta" data-label={t('totp')} className={table.cell}>
        <span className={styles.verdict} data-ok={member.totp}>
          <Icon name={member.totp ? 'circle-check' : 'circle-alert'} />
          {t(member.totp ? 'totpYes' : 'totpNo')}
        </span>
      </td>
      <td role="cell" data-col="meta" data-label={t('contacts')} className={`${table.cell} ${table.right} ${table.num}`}>
        {contacts}
      </td>
      <td role="cell" data-col="meta" data-label={t('pending')} className={`${table.cell} ${table.right} ${table.num}`}>
        {member.pendingCount > 0
          ? t('pendingValue', { amount: format.number(member.pendingAmount, MONEY_FORMAT), count: member.pendingCount })
          : t('none')}
      </td>
      <td role="cell" className={`${table.cell} ${styles.act}`}>
        {closer ? (
          <>
            <RateSheet memberId={member.id} name={member.name} rate={member.rate ?? 0} />
            <ReassignSheet memberId={member.id} name={member.name} portfolio={portfolio} targets={targets} />
            <ConfirmSheet kind={disabled ? 'activate' : 'deactivate'} id={member.id} target={member.name} count={portfolio.all} />
          </>
        ) : null}
      </td>
    </tr>
  );
}
