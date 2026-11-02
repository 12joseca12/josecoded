import { getTranslations } from 'next-intl/server';

import { PriceRow } from './price-row';
import styles from './price-table.module.css';
import table from '../../crm/table-stack/crm-table.module.css';

import type { PriceItem, PricePack } from '@/lib/pricing/catalogue';
import type { Locale } from '@josecoded/types';

const COLUMNS = {
  packs: [
    { key: 'pack', right: false },
    { key: 'price', right: true },
    { key: 'weeks', right: true },
    { key: 'sale', right: false },
    { key: 'visibility', right: false },
  ],
  extras: [
    { key: 'extra', right: false },
    { key: 'price', right: true },
    { key: 'billing', right: false },
    { key: 'visibility', right: false },
  ],
} as const;

/**
 * The packs (with their option under each) or the extras of D2 Precios: one table with two variants. Real table
 * semantics (`caption`, `th scope`) with explicit roles because below 46rem of its own width every row is stacked into
 * a block; where the columns do not fit it scrolls inside a focusable region.
 */
export async function PriceTable({
  variant,
  items,
  locale,
}: {
  variant: 'packs' | 'extras';
  items: readonly (PriceItem | PricePack)[];
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'adminPricing.table' });
  return (
    <div className={`${table.box} ${styles.box}`} role="region" aria-label={t(`${variant}Caption`)} tabIndex={0}>
      <table className={table.table} role="table">
        <caption className="sr-only">{t(`${variant}Caption`)}</caption>
        <thead role="rowgroup" className={table.head}>
          <tr role="row">
            {COLUMNS[variant].map((column) => (
              <th key={column.key} role="columnheader" scope="col" className={`${table.th} ${column.right ? table.right : ''}`}>
                {t(`columns.${column.key}`)}
              </th>
            ))}
            <th role="columnheader" scope="col" className={table.th}>
              <span className="sr-only">{t('actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className={table.body}>
          {items.flatMap((item) => [item, ...('options' in item ? item.options : [])]).map((item) => (
            <PriceRow key={`${item.kind}-${item.code}`} item={item} variant={variant} locale={locale} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
