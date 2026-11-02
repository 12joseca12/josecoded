import { getTranslations } from 'next-intl/server';

import { CommissionRow } from './commission-row';
import styles from './commission-table.module.css';
import table from '../table-stack/crm-table.module.css';

import type { CommissionRecord } from '@/lib/crm/commissions';
import type { Locale } from '@josecoded/types';

type Column = {
  key: 'contact' | 'closed' | 'closer' | 'charged' | 'percent' | 'commission' | 'status' | 'paid';
  right: boolean;
};

/**
 * The list of K5: one row per commission, the latest closing first. Real table semantics (`caption`, `th scope`) with
 * explicit roles because below 46rem of its own width every row is stacked into a block and the browser would drop
 * them. Where the admin's nine columns do not fit (a tablet), the table scrolls inside its own region, which can be
 * focused to scroll it with the keyboard, instead of the page. The «Closer» column and the actions exist only for the admin (`admin`): a closer's table has neither.
 */
export async function CommissionTable({
  rows,
  locale,
  admin,
}: {
  rows: readonly CommissionRecord[];
  locale: Locale;
  admin: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'crmCommissions.table' });
  const columns: Column[] = [
    { key: 'contact', right: false },
    { key: 'closed', right: false },
    { key: 'closer', right: false },
    { key: 'charged', right: true },
    { key: 'percent', right: true },
    { key: 'commission', right: true },
    { key: 'status', right: false },
    { key: 'paid', right: false },
  ].filter((column) => admin || column.key !== 'closer') as Column[];

  return (
    <div className={`${table.box} ${styles.box}`} role="region" aria-label={t('caption')} tabIndex={0}>
      <table className={table.table} role="table">
        <caption className="sr-only">{t('caption')}</caption>
        <thead role="rowgroup" className={table.head}>
          <tr role="row">
            {columns.map((column) => (
              <th key={column.key} role="columnheader" scope="col" className={`${table.th} ${column.right ? table.right : ''}`}>
                {t(column.key)}
              </th>
            ))}
            {admin ? (
              <th role="columnheader" scope="col" className={table.th}>
                <span className="sr-only">{t('actions')}</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody role="rowgroup" className={table.body}>
          {rows.map((row) => (
            <CommissionRow key={row.id} row={row} locale={locale} admin={admin} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
