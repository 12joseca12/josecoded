import { getTranslations } from 'next-intl/server';

import { Action } from '@/components/ui/action';

import { DueLabel } from '../due-label';
import styles from './overdue-list.module.css';

import type { ContactRow } from '@/lib/crm/contacts';
import type { Locale } from '@josecoded/types';

/**
 * The oldest overdue contacts, as a short list under the figure of K1: name, company or next action, and how late
 * it is. Each row is a link to the contact. Nothing is rendered when nothing is overdue.
 */
export async function OverdueList({ rows, locale }: { rows: readonly ContactRow[]; locale: Locale }) {
  if (rows.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'crmContacts.overdueList' });
  return (
    <ul className={styles.list} role="list" aria-label={t('label')}>
      {rows.map((row) => (
        <li key={row.id} className={styles.item}>
          <Action href={`/crm/contactos/${row.id}`} className={styles.row}>
            <span className={styles.name}>{row.display_name}</span>
            <span className={styles.what}>{row.next_action ?? row.organization ?? t('none')}</span>
            <span className={styles.due}>
              <DueLabel at={row.next_action_at} locale={locale} />
            </span>
          </Action>
        </li>
      ))}
    </ul>
  );
}
