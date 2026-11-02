import { getFormatter, getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';

import { DetailCard } from '../detail-card';
import styles from './contact-detail.module.css';

import type { ContactRecord } from '@/lib/crm/contact-detail';
import type { Locale } from '@josecoded/types';
import type { ReactNode } from 'react';

/**
 * The fixed data of the contact (side column): phone, city, role, origin, language, tags, date of entry. The pencil is
 * where editing them will be (the form is not built yet: the button is there, disabled, so nobody looks for it).
 */
export async function DataCard({ contact, locale }: { contact: ContactRecord; locale: Locale }) {
  const [t, tSource, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts.data' }),
    getTranslations({ locale, namespace: 'crmContacts.sources' }),
    getFormatter({ locale }),
  ]);
  const rows: [string, ReactNode][] = [
    [t('phone'), contact.phone ? <span className={styles.num}>{contact.phone}</span> : null],
    [t('city'), contact.organization?.city ?? null],
    [t('role'), contact.role],
    [t('source'), tSource.has(contact.source) ? tSource(contact.source) : contact.source],
    [
      t('language'),
      contact.locale ? (
        <span className={styles.lang}>{contact.locale.toLocaleUpperCase()}</span>
      ) : null,
    ],
    [
      t('tags'),
      contact.tags.length ? (
        <span className={styles.tags}>
          {contact.tags.map((tag) => (
            <Chip key={tag} size="sm">
              {tag}
            </Chip>
          ))}
        </span>
      ) : null,
    ],
    [
      t('since'),
      format.dateTime(new Date(contact.created_at), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/Madrid',
      }),
    ],
  ];
  return (
    <DetailCard
      icon="user-round"
      title={t('title')}
      action={
        <Button iconOnly icon="pencil" variant="quiet" size="sm" aria-label={t('edit')} disabled />
      }
    >
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
