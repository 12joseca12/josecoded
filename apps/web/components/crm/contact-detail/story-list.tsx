import { getTranslations } from 'next-intl/server';

import { StoryCard } from '@/components/stories/story-card';
import { ArrowLink } from '@/components/ui/arrow-link';

import styles from './contact-detail.module.css';

import type { StoryRecord } from '@/lib/crm/contact-detail';
import type { Locale } from '@josecoded/types';

/** The stories the client proposed (read only: they are decided in the file of the client, task 6.12). */
export async function StoryList({ stories, clientId, locale }: { stories: readonly StoryRecord[]; clientId: string | null; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'crmContacts.stories' });
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
            <li key={story.id}>
              <StoryCard story={story} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
