import { getTranslations } from 'next-intl/server';

import { StaffRow } from './staff-row';
import styles from './team-table.module.css';
import table from '../../crm/table-stack/crm-table.module.css';

import type { TeamMember } from '@/lib/team/team';
import type { Locale } from '@josecoded/types';

const COLUMNS = [
  { key: 'person', right: false },
  { key: 'role', right: false },
  { key: 'status', right: false },
  { key: 'rate', right: true },
  { key: 'telegram', right: false },
  { key: 'totp', right: false },
  { key: 'contacts', right: true },
  { key: 'pending', right: true },
] as const;

/**
 * The people of D1. Real table semantics (`caption`, `th scope`) with explicit roles because below 46rem of its own
 * width every row is stacked into a block and the browser would drop them; where the nine columns do not fit, the
 * table scrolls inside its own region, which can be focused to scroll it with the keyboard.
 */
export async function TeamTable({ members, locale }: { members: readonly TeamMember[]; locale: Locale }) {
  const [t, tRow] = await Promise.all([
    getTranslations({ locale, namespace: 'adminTeam.table' }),
    getTranslations({ locale, namespace: 'adminTeam.sheets' }),
  ]);
  return (
    <div className={`${table.box} ${styles.box}`} role="region" aria-label={t('caption')} tabIndex={0}>
      <table className={table.table} role="table">
        <caption className="sr-only">{t('caption')}</caption>
        <thead role="rowgroup" className={table.head}>
          <tr role="row">
            {COLUMNS.map((column) => (
              <th key={column.key} role="columnheader" scope="col" className={`${table.th} ${column.right ? table.right : ''} ${column.key === 'pending' ? styles.wrapHead : ''}`}>
                {t(column.key)}
              </th>
            ))}
            <th role="columnheader" scope="col" className={table.th}>
              <span className="sr-only">{t('actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className={table.body}>
          {members.map((member) => (
            <StaffRow
              key={member.id}
              member={member}
              locale={locale}
              targets={members
                .filter((other) => !other.disabled && other.id !== member.id)
                .map((other) => ({ value: other.id, label: other.role === 'admin' ? tRow('reassign.you', { name: other.name }) : other.name }))}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
