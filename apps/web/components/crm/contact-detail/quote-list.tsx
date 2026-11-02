import { getTranslations } from 'next-intl/server';

import { EmptyState } from '@/components/shared/empty-state';

import styles from './contact-detail.module.css';

import type { Locale } from '@josecoded/types';

/**
 * The «Presupuestos» tab of the contact. The tab and its place are fixed by the prototype; the quotes themselves
 * (list, composer, duplicate) arrive with task 6.17, so until then it says so instead of showing a blank panel.
 */
export async function QuoteList({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'crmContacts.detail.quotes' });
  return (
    <div>
      <div className={styles.sectionHead}>
        <h2>{t('title')}</h2>
      </div>
      <EmptyState title={t('empty')} text={t('text')} />
    </div>
  );
}
