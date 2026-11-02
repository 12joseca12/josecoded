import { getTranslations } from 'next-intl/server';

import { StoryCard } from '@/components/stories/story-card';
import { storyCounts } from '@/lib/stories/status';

import styles from './client-detail.module.css';

import type { ClientStory } from '@/lib/crm/client-queries';
import type { Locale, StoryStatus } from '@josecoded/types';

const ORDER: readonly StoryStatus[] = ['proposed', 'accepted', 'converted', 'rejected'];

/**
 * The stories the client proposed, to read: each with its verdict once decided and, when it became a task, the link to
 * it. The decision itself (accept, reject, convert) arrives with its own sheet; here nobody decides anything.
 */
export async function ClientStories({ stories, locale }: { stories: readonly ClientStory[]; locale: Locale }) {
  const [t, tCount] = await Promise.all([
    getTranslations({ locale, namespace: 'crmClients.file' }),
    getTranslations({ locale, namespace: 'crmClients.file.storiesCount' }),
  ]);
  const counts = storyCounts(stories);
  const caption = ORDER.filter((status) => counts[status] > 0)
    .map((status) => tCount(status, { count: counts[status] }))
    .join(' · ');

  return (
    <div className={styles.stories}>
      <div className={styles.sectionHead}>
        <h2>{t('storiesTitle')}</h2>
        {caption ? <span className={styles.caption}>{caption}</span> : null}
      </div>
      {stories.length === 0 ? (
        <p className={styles.hint}>{t('storiesEmpty')}</p>
      ) : (
        <div className={styles.storyList}>
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} locale={locale} taskHref={story.status === 'converted' && story.task_id ? `#task-${story.task_id}` : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
