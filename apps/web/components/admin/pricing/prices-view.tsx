import { NextIntlClientProvider } from 'next-intl';
import { getFormatter, getMessages, getTranslations } from 'next-intl/server';

import { contentTabs } from '@/components/admin/texts/content-tabs';
import { TabNav } from '@/components/crm/tab-nav';
import { PageHead } from '@/components/staff/page-head';
import { Icon } from '@/components/ui/icon';
import { PRICE_FORMAT, pendingCount } from '@/lib/pricing/catalogue';

import { PriceItemSheet } from './price-item-sheet';
import { PriceTable } from './price-table';
import styles from './prices-view.module.css';
import { PricingChanges } from './pricing-changes';

import type { Catalogue } from '@/lib/pricing/catalogue';
import type { CatalogChange } from '@/lib/pricing/diff';
import type { Locale } from '@josecoded/types';

/**
 * The Precios tab of D2 as a view of already-read data (admin only): the page fetches and the dev preview feeds it
 * fixtures. Only the sentences of the sheet travel to the browser. `notice` is a line the page may add. The head and the tab strip are the Contenido ones, lifted out when the other
 * tabs arrive.
 */
export async function PricesView({
  locale,
  catalogue,
  notice,
  changes,
  textsPending = 0,
}: {
  locale: Locale;
  catalogue: Catalogue;
  notice?: string;
  /** The diff against the published catalogue (`null`: the draft is not valid yet). Absent in the dev preview. */
  changes?: readonly CatalogChange[] | null;
  /** Unpublished text changes, for the count on the Textos tab (the texts' draft is wired in a later block). */
  textsPending?: number;
}) {
  const [t, tabs, format, messages] = await Promise.all([
    getTranslations({ locale, namespace: 'adminPricing' }),
    getTranslations({ locale, namespace: 'adminTexts.tabs' }),
    getFormatter({ locale }),
    getMessages(),
  ]);
  const pending = pendingCount(catalogue);
  return (
    <NextIntlClientProvider messages={{ adminPricing: { sheet: messages.adminPricing.sheet } }}>
      <PageHead title={t('title')} tone={t('tone')} lead={t('lead')} />
      <TabNav label={t('tabsLabel')} current="precios" items={contentTabs({ texts: tabs('texts'), prices: t('tab') }, { texts: textsPending, prices: pending })} />
      {notice ? (
        <p className={styles.band} data-tone="info" role="status">
          <Icon name="info" />
          <span>{notice}</span>
        </p>
      ) : null}
      {pending > 0 ? (
        <p className={styles.band} data-tone="attention" role="status">
          <Icon name="triangle-alert" />
          <span>{t.rich('pendingBand', { count: pending, strong: (chunks) => <strong>{chunks}</strong> })}</span>
        </p>
      ) : null}
      <p className={styles.band}>
        <Icon name="info" />
        <span>{t('vatNote')}</span>
      </p>
      {changes === undefined ? null : <PricingChanges changes={changes} locale={locale} />}
      <section className={styles.section} aria-labelledby="prices-packs">
        <div className={styles.sectionHead}>
          <h2 id="prices-packs">{t('packs')}</h2>
          <PriceItemSheet kind="pack" />
        </div>
        <PriceTable variant="packs" items={catalogue.packs} locale={locale} />
      </section>
      <section className={styles.section} aria-labelledby="prices-extras">
        <div className={styles.sectionHead}>
          <h2 id="prices-extras">{t('extras')}</h2>
          <PriceItemSheet kind="extra" />
        </div>
        <PriceTable variant="extras" items={catalogue.extras} locale={locale} />
      </section>
      <section className={styles.section} aria-labelledby="prices-rates">
        <h2 id="prices-rates">{t('rates.title')}</h2>
        <dl className={styles.rates}>
          {(['hourly', 'feature'] as const).map((key) => (
            <div key={key} className={styles.rate}>
              <dt>{t(`rates.${key}`)}</dt>
              <dd>
                <strong>{format.number(catalogue[key], PRICE_FORMAT)}</strong>
                <span>{t('rates.noVat')}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </NextIntlClientProvider>
  );
}
