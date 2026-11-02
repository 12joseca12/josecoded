import { getFormatter, getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';
import { Action } from '@/components/ui/action';
import { toInputParts } from '@/lib/crm/next-action';
import { statusTone } from '@/lib/crm/status';

import { DueLabel } from '../due-label';
import { OwnerBadge } from '../owner-badge';
import { StatusSheetButton } from '../status-sheet';
import styles from './contact-table.module.css';

import type { ContactRow, Owner } from '@/lib/crm/contacts';
import type { StatusKey } from '@/lib/crm/status';
import type { Locale } from '@josecoded/types';

/**
 * The inbox (K2): one row per contact, the overdue ones first. Real table semantics (`caption`, `th scope`), with
 * explicit roles because below 46rem of its own width every row is stacked into a block and the browser would drop
 * them. The whole row opens the contact through the link of the name (its `::after` covers the row), so there are
 * no nested interactive elements; the pencil is the one other control and sits above the cover.
 *
 * `owners` is only given to the admin: with it the table has the «Dueño» column. A closer's table has no owner
 * column and her rows carry no owner.
 */
export async function ContactTable({
  rows,
  owners,
  locale,
}: {
  rows: readonly ContactRow[];
  owners: readonly Owner[] | null;
  locale: Locale;
}) {
  const [t, tKinds, tStatus, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts.table' }),
    getTranslations({ locale, namespace: 'crmContacts.kinds' }),
    getTranslations({ locale, namespace: 'crmContacts.status' }),
    getFormatter({ locale }),
  ]);
  const byId = new Map((owners ?? []).map((owner) => [owner.user_id, owner]));
  const showOwner = owners !== null;
  const day = (iso: string | null) =>
    iso ? format.dateTime(new Date(iso), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' }) : t('none');

  return (
    <div className={styles.box}>
      <table className={styles.table} role="table">
        <caption className="sr-only">{t('caption')}</caption>
        <thead role="rowgroup" className={styles.head}>
          <tr role="row">
            <th role="columnheader" scope="col" className={styles.th}>{t('contact')}</th>
            <th role="columnheader" scope="col" className={styles.th}>{t('kind')}</th>
            <th role="columnheader" scope="col" className={styles.th}>{t('status')}</th>
            <th role="columnheader" scope="col" className={styles.th}>{t('next')}</th>
            <th role="columnheader" scope="col" className={styles.th}>{t('last')}</th>
            {showOwner ? <th role="columnheader" scope="col" className={styles.th}>{t('owner')}</th> : null}
            <th role="columnheader" scope="col" className={styles.th}><span className="sr-only">{t('actions')}</span></th>
          </tr>
        </thead>
        <tbody role="rowgroup" className={styles.body}>
          {rows.map((row) => {
            const owner = row.owner_id ? byId.get(row.owner_id) : undefined;
            const parts = toInputParts(row.next_action_at);
            const name = row.display_name;
            return (
              <tr key={row.id} role="row" className={styles.row}>
                <td role="cell" data-col="main" className={styles.cell}>
                  <div className={styles.main}>
                    <Action href={`/crm/contactos/${row.id}`} className={styles.link}>
                      {name}
                    </Action>
                    <span className={row.organization ? undefined : styles.muted}>{row.organization ?? t('noOrganization')}</span>
                  </div>
                </td>
                <td role="cell" data-col="meta" data-label={t('kind')} className={styles.cell}>
                  <span className={styles.kind}>{tKinds(row.kind)}</span>
                </td>
                <td role="cell" data-col="status" className={styles.cell}>
                  <StatusBadge tone={statusTone(row.status)}>{tStatus(row.status as StatusKey)}</StatusBadge>
                </td>
                <td role="cell" data-col="wide" className={styles.cell}>
                  <div className={styles.next}>
                    <span className={styles.nextText}>{row.next_action ?? t('none')}</span>
                    <DueLabel at={row.next_action_at} locale={locale} />
                  </div>
                </td>
                <td role="cell" data-col="meta" data-label={t('last')} className={`${styles.cell} ${styles.num}`}>
                  {day(row.last_interaction_at)}
                </td>
                {showOwner ? (
                  <td role="cell" data-col="meta" data-label={t('owner')} className={styles.cell}>
                    {owner ? (
                      <OwnerBadge
                        state={owner.disabled ? 'off' : 'assigned'}
                        name={owner.display_name}
                        suffix={owner.disabled ? t('ownerOff') : undefined}
                      />
                    ) : (
                      <OwnerBadge state="unassigned" name={t('unassigned')} />
                    )}
                  </td>
                ) : null}
                <td role="cell" className={`${styles.cell} ${styles.act}`}>
                  <StatusSheetButton
                    ariaLabel={t('editStatus', { name })}
                    contact={{
                      id: row.id,
                      name,
                      organization: row.organization,
                      kind: row.kind,
                      status: row.status,
                      nextAction: row.next_action,
                      date: parts?.date ?? null,
                      time: parts?.time ?? null,
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
