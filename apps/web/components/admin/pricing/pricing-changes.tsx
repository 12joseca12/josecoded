import { getFormatter, getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { PRICE_FORMAT } from '@/lib/pricing/catalogue';

import styles from './pricing-changes.module.css';

import type { CatalogChange } from '@/lib/pricing/diff';
import type { Locale } from '@josecoded/types';

/**
 * What publishing would change in the catalogue: one line per item (kind, code, what moved). `changes` is `null` when
 * the draft is not a valid catalogue yet. The Publish button is disabled until the publication flow of the texts can
 * carry the catalogue; the note beside it says so.
 */
export async function PricingChanges({ changes, locale }: { changes: readonly CatalogChange[] | null; locale: Locale }) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'adminPricing.changes' }), getFormatter({ locale })]);
  const money = (value: number | null) => (value === null ? '' : format.number(value, PRICE_FORMAT));
  return (
    <section className={styles.box} aria-labelledby="prices-changes">
      <div className={styles.head}>
        <h2 id="prices-changes">{t('title')}</h2>
        <Button size="sm" disabled aria-describedby="prices-publish-note">
          {t('publish')}
        </Button>
      </div>
      <p id="prices-publish-note" className={styles.note}>
        <Icon name="info" />
        <span>{t('publishPending')}</span>
      </p>
      {changes === null ? (
        <p className={styles.note}>{t('invalid')}</p>
      ) : changes.length === 0 ? (
        <p className={styles.note}>{t('none')}</p>
      ) : (
        <ul className={styles.list}>
          {changes.map((change) => (
            <li key={`${change.section}-${change.code}`} className={styles.item} data-type={change.type}>
              <span className={styles.kind}>{t(`sections.${change.section}`)}</span>
              <strong>{change.section === 'rates' ? t(`rates.${change.code as 'hourly' | 'feature'}`) : change.code}</strong>
              <span className={styles.what}>
                {t(change.type)}
                {change.type === 'changed' ? ` · ${change.fields.map((field) => t(`fields.${field as 'name'}`)).join(', ')}` : ''}
              </span>
              {change.price && change.type === 'changed' ? <span className={styles.price}>{t('priceMove', { from: money(change.price.from), to: money(change.price.to) })}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
