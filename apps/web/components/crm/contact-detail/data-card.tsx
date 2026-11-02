import { getFormatter, getTranslations } from 'next-intl/server';

import { DetailCard } from '../detail-card';
import styles from './contact-detail.module.css';

import type { ContactRecord } from '@/lib/crm/contact-detail';
import type { Locale } from '@josecoded/types';

/** The fixed data of the contact (side column): phone, city, role, origin, language, tags, date of entry. */
export async function DataCard({ contact, locale }: { contact: ContactRecord; locale: Locale }) {
  const [t, tSource, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts.data' }),
    getTranslations({ locale, namespace: 'crmContacts.sources' }),
    getFormatter({ locale }),
  ]);
  const rows: [string, string | null][] = [
    [t('phone'), contact.phone],
    [t('city'), contact.organization?.city ?? null],
    [t('role'), contact.role],
    [t('source'), tSource.has(contact.source) ? tSource(contact.source) : contact.source],
    [t('language'), contact.locale ? contact.locale.toLocaleUpperCase() : null],
    [t('tags'), contact.tags.length ? contact.tags.join(', ') : null],
    [t('since'), format.dateTime(new Date(contact.created_at), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' })],
  ];
  return (
    <DetailCard icon="user-round" title={t('title')}>
      <dl className={styles.dl}>
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
      </dl>
    </DetailCard>
  );
}
