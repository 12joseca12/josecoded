import { getFormatter, getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';
import { PRICE_FORMAT } from '@/lib/pricing/catalogue';

import { PriceItemSheet } from './price-item-sheet';
import styles from './price-table.module.css';
import table from '../../crm/table-stack/crm-table.module.css';

import type { PriceItem } from '@/lib/pricing/catalogue';
import type { Locale } from '@josecoded/types';

/**
 * One line of the catalogue. A pack shows `P2 · Name`, its option sits right under it with the name indented and
 * the word «Opción» (the nesting is said in text, not only in the indent), an extra shows its name over its code.
 * Money has no VAT: the column header says it. A price changed in the draft keeps the published one as «Antes».
 */
export async function PriceRow({
  item,
  variant,
  locale,
  packCode,
}: {
  item: PriceItem;
  variant: 'packs' | 'extras';
  locale: Locale;
  /** The pack an option belongs to (the sheet sends it to the action). */
  packCode?: string;
}) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'adminPricing.table' }), getFormatter({ locale })]);
  const option = item.kind === 'option';
  const title = option ? t('option', { name: item.name.es }) : item.kind === 'pack' ? `${item.code} · ${item.name.es}` : item.name.es;
  const pack = variant === 'packs';

  return (
    <tr role="row" className={`${table.row} ${styles.row}`} data-level={option ? 'option' : undefined}>
      <td role="cell" data-col="main" className={`${table.cell} ${styles.nameCell}`}>
        <span className={styles.name}>
          <span className={styles.title}>
            <strong>{title}</strong>
            {item.pending ? <StatusBadge tone="attention">{t('pending')}</StatusBadge> : null}
          </span>
          {pack ? null : <span className={styles.code}>{item.code}</span>}
          {item.name.en === null ? <span className={styles.todo}>{t('noEnglish')}</span> : null}
        </span>
      </td>
      <td role="cell" data-col="meta" data-label={t('columns.price')} className={`${table.cell} ${table.right} ${table.num}`}>
        {format.number(item.price, PRICE_FORMAT)}
        {item.previous === null ? null : <span className={styles.was}>{t('was', { amount: format.number(item.previous, PRICE_FORMAT) })}</span>}
      </td>
      <td role="cell" data-col="meta" data-label={pack ? t('columns.weeks') : t('columns.billing')} className={`${table.cell} ${pack ? `${table.right} ${table.num}` : ''}`}>
        {pack ? item.weeks : item.billing ? t(`billings.${item.billing}`) : null}
      </td>
      {pack ? (
        <td role="cell" data-col="status" className={table.cell}>
          <StatusBadge tone={item.onSale ? 'live' : 'muted'}>{t(item.onSale ? 'onSale' : 'paused')}</StatusBadge>
        </td>
      ) : null}
      <td role="cell" data-col="status" className={table.cell}>
        <StatusBadge tone={item.visible ? 'live' : 'muted'}>{t(item.visible ? 'visible' : 'hidden')}</StatusBadge>
      </td>
      <td role="cell" className={`${table.cell} ${styles.act}`}>
        <PriceItemSheet kind={item.kind} item={item} packCode={packCode} />
        {item.kind === 'pack' ? <PriceItemSheet kind="option" packCode={item.code} /> : null}
      </td>
    </tr>
  );
}
