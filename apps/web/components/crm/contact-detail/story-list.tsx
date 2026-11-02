import { getFormatter, getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowLink } from '@/components/ui/arrow-link';
import { Icon } from '@/components/ui/icon';

import styles from './contact-detail.module.css';

import type { StoryRecord } from '@/lib/crm/contact-detail';
import type { Locale } from '@josecoded/types';

/** The stories the client proposed (read only: they are decided in the file of the client, task 6.12). */
export async function StoryList({ stories, clientId, locale }: { stories: readonly StoryRecord[]; clientId: string | null; locale: Locale }) {
  const [t, format] = await Promise.all([getTranslations({ locale, namespace: 'crmContacts.stories' }), getFormatter({ locale })]);
  return (
    <div>
      <div className={styles.sectionHead}>
        <h2>{t('title')}</h2>
        {clientId ? <ArrowLink size="sm" href={`/crm/clientes/${clientId}`}>{t('decide')}</ArrowLink> : null}
      </div>
      {stories.length === 0 ? (
        <p className={`${styles.small} ${styles.muted}`}>{t('empty')}</p>
      ) : (
        <ul className={styles.stories} role="list">
          {stories.map((story) => (
            <li key={story.id} className={styles.story}>
              <div className={styles.storyHead}>
                <h3>{story.title}</h3>
                <StatusBadge tone={story.status === 'proposed' ? 'attention' : story.status === 'rejected' ? 'muted' : 'live'}>
                  {t(`status.${story.status}`)}
                </StatusBadge>
                <span className={styles.date}>
                  {format.dateTime(new Date(story.created_at), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })}
                </span>
              </div>
              <div className={styles.cqp}>
                <p>
                  <b>{t('as')}</b> {story.as_a}
                </p>
                <p>
                  <b>{t('want')}</b> {story.i_want}
                </p>
                <p>
                  <b>{t('so')}</b> {story.so_that}
                </p>
              </div>
              {story.acceptance_criteria.length > 0 ? (
                <ul className={styles.criteria} role="list" aria-label={t('criteria')}>
                  {story.acceptance_criteria.map((criterion) => (
                    <li key={criterion}>
                      <Icon name="circle-check" />
                      {criterion}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
