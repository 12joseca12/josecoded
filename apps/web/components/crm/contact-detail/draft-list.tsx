import { getFormatter, getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';

import styles from './contact-detail.module.css';

import type { DraftRecord } from '@/lib/crm/contact-detail';
import type { Locale } from '@josecoded/types';

/** The drafts and messages of the contact (read only here: the composer arrives with task 6.8). */
export async function DraftList({ drafts, locale }: { drafts: readonly DraftRecord[]; locale: Locale }) {
  const [t, tChannel, format] = await Promise.all([
    getTranslations({ locale, namespace: 'crmContacts.drafts' }),
    getTranslations({ locale, namespace: 'crmContacts.channels' }),
    getFormatter({ locale }),
  ]);
  return (
    <div>
      <div className={styles.sectionHead}>
        <h2>{t('title')}</h2>
      </div>
      <p className={`${styles.small} ${styles.muted}`}>{t('composerSoon')}</p>
      {drafts.length > 0 ? (
        <ul className={styles.list} role="list">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <strong>{draft.subject ?? tChannel(draft.channel)}</strong>
              <span>{tChannel(draft.channel)}</span>
              <span className={styles.date}>
                {format.dateTime(new Date(draft.created_at), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })}
              </span>
              <StatusBadge tone={draft.status === 'marked_sent' ? 'active' : draft.status === 'discarded' ? 'muted' : 'neutral'}>
                {t(`status.${draft.status}`)}
              </StatusBadge>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`${styles.small} ${styles.muted}`}>{t('empty')}</p>
      )}
    </div>
  );
}
