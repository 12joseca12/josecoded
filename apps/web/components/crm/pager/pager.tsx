import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';

import styles from './pager.module.css';

import type { Locale } from '@josecoded/types';

/**
 * «1–25 de 128» and the previous / next links of a list. The links are real links to the neighbour pages (the URL
 * keeps every filter), and the one that leads nowhere is not rendered as a link: it is a disabled button.
 */
export async function Pager({
  page,
  pageSize,
  total,
  hrefFor,
  locale,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => `/${string}`;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'crmContacts.pager' });
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const last = Math.ceil(total / pageSize);
  return (
    <nav className={styles.pager} aria-label={t('label')}>
      <p className={styles.range}>{t('range', { from, to, total })}</p>
      <div className={styles.buttons}>
        {page > 1 ? (
          <Button href={hrefFor(page - 1)} variant="quiet" size="sm">
            {t('previous')}
          </Button>
        ) : (
          <Button variant="quiet" size="sm" disabled>
            {t('previous')}
          </Button>
        )}
        {page < last ? (
          <Button href={hrefFor(page + 1)} variant="ghost" size="sm" iconAfter="chevron-right">
            {t('next')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" iconAfter="chevron-right" disabled>
            {t('next')}
          </Button>
        )}
      </div>
    </nav>
  );
}
