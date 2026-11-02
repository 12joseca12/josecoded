import { getTranslations } from 'next-intl/server';

import { PhaseSteps } from '@/components/shared/phase-steps';
import { StatusBadge } from '@/components/shared/status-badge';
import { Action } from '@/components/ui/action';
import { accessTone } from '@/lib/crm/clients';

import { OwnerBadge } from '../owner-badge';
import { accessLabel } from './access-label';
import { ClientInviteButton } from './client-invite-button';
import styles from './client-table.module.css';
import table from '../table-stack/crm-table.module.css';

import type { StaffRole } from '@/lib/auth/staff';
import type { ClientRow } from '@/lib/crm/clients';
import type { Owner } from '@/lib/crm/contacts';
import type { Locale } from '@josecoded/types';

/**
 * The list of K6: one row per client with pack, phase, state of the portal access and the stories waiting. Real table
 * semantics (`caption`, `th scope`) with explicit roles because below 46rem of its own width every row is stacked into a
 * block and the browser would drop them; the whole row opens the file through the link of the name. Where the admin's
 * columns do not fit, the table scrolls inside its own region, which can be focused to scroll it with the keyboard.
 *
 * `owners` is given to the admin only: with it the table has the «Dueño» column. «Habilitar acceso» is offered while
 * the client has none and the invitation has an address to go to (a closer cannot write another one).
 */
export async function ClientTable({
  rows,
  owners,
  role,
  locale,
}: {
  rows: readonly ClientRow[];
  owners: readonly Owner[] | null;
  role: StaffRole;
  locale: Locale;
}) {
  const [t, tInvite] = await Promise.all([
    getTranslations({ locale, namespace: 'crmClients.table' }),
    getTranslations({ locale, namespace: 'crmClients' }),
  ]);
  const byId = new Map((owners ?? []).map((owner) => [owner.user_id, owner]));
  const showOwner = owners !== null;
  const labels = await Promise.all(rows.map((row) => accessLabel(row.access, locale)));

  return (
    <div className={`${table.box} ${styles.box}`} role="region" aria-label={t('caption')} tabIndex={0}>
      <table className={table.table} role="table">
        <caption className="sr-only">{t('caption')}</caption>
        <thead role="rowgroup" className={table.head}>
          <tr role="row">
            {(['client', 'pack', 'phase', 'access', 'stories'] as const).map((key) => (
              <th key={key} role="columnheader" scope="col" className={table.th}>
                {t(key)}
              </th>
            ))}
            {showOwner ? (
              <th role="columnheader" scope="col" className={table.th}>
                {t('owner')}
              </th>
            ) : null}
            <th role="columnheader" scope="col" className={table.th}>
              <span className="sr-only">{t('actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className={table.body}>
          {rows.map((row, index) => {
            const owner = row.ownerId ? byId.get(row.ownerId) : undefined;
            const name = row.organization ?? row.name;
            const canInvite = row.access.state === 'none' && (role === 'admin' || Boolean(row.email));
            return (
              <tr key={row.id} role="row" className={`${table.row} ${styles.row}`}>
                <td role="cell" data-col="main" className={`${table.cell} ${styles.mainCell}`}>
                  <div className={table.main}>
                    <Action href={`/crm/clientes/${row.id}`} className={styles.link}>
                      {name}
                    </Action>
                    <span>{row.organization ? row.name : t('noBusiness')}</span>
                  </div>
                </td>
                <td role="cell" data-col="meta" data-label={t('pack')} className={`${table.cell} ${styles.pack}`}>
                  {[row.packCode, row.packOption].filter(Boolean).join(' · ')}
                </td>
                <td role="cell" data-col="wide" className={table.cell}>
                  <PhaseSteps phase={row.phase} locale={locale} />
                </td>
                <td role="cell" data-col="status" className={table.cell}>
                  <StatusBadge tone={accessTone(row.access)}>{labels[index]}</StatusBadge>
                </td>
                <td role="cell" data-col="meta" data-label={t('stories')} className={table.cell}>
                  {row.storiesPending > 0 ? (
                    <StatusBadge tone="attention">{tInvite('storiesPending', { count: row.storiesPending })}</StatusBadge>
                  ) : (
                    <span className={table.muted}>{t('none')}</span>
                  )}
                </td>
                {showOwner ? (
                  <td role="cell" data-col="meta" className={table.cell}>
                    {owner ? (
                      <OwnerBadge state={owner.disabled ? 'off' : 'assigned'} name={owner.display_name} />
                    ) : (
                      <span className={table.muted}>{t('none')}</span>
                    )}
                  </td>
                ) : null}
                <td role="cell" className={`${table.cell} ${styles.act}`}>
                  {canInvite ? <ClientInviteButton client={row} role={role} locale={locale} size="sm" /> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
