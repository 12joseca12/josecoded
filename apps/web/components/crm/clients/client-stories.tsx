import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';

import { StoryCard } from '@/components/stories/story-card';
import { StoryDecisionSheet } from '@/components/stories/story-decision-sheet';
import { storyCounts, nextActions } from '@/lib/stories/status';

import styles from './client-detail.module.css';

import type { StaffRole } from '@/lib/auth/staff';
import type { ClientStory } from '@/lib/crm/client-queries';
import type { Locale, StoryStatus } from '@josecoded/types';

const ORDER: readonly StoryStatus[] = ['proposed', 'accepted', 'converted', 'rejected'];

/**
 * The stories the client proposed, with what the staff can do with each: «Decidir» for a proposed one (the one violet
 * action of the file), «Convertir en tarea» for an accepted one, the verdict for the rest. The buttons come from
 * `nextActions`, the same table the Server Actions check, and the database decides in the end who may (the admin and
 * the owner closer). Only the sentences of the sheets travel to the browser.
 */
export async function ClientStories({
  stories,
  client,
  role,
  locale,
}: {
  stories: readonly ClientStory[];
  /** The name the sheets and the task carry. */
  client: string;
  role: StaffRole;
  locale: Locale;
}) {
  const [t, tStories, tSheet, messages] = await Promise.all([
    getTranslations({ locale, namespace: 'crmClients.file' }),
    getTranslations({ locale, namespace: 'crmClients.file.storiesCount' }),
    getTranslations({ locale, namespace: 'crmClients.stories.decideSheet' }),
    getMessages(),
  ]);
  const counts = storyCounts(stories);
  const caption = ORDER.filter((status) => counts[status] > 0)
    .map((status) => tStories(status, { count: counts[status] }))
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
        <NextIntlClientProvider messages={{ crmClients: { stories: messages.crmClients.stories } }}>
          <div className={styles.storyList}>
            {stories.map((story) => {
              const actions = nextActions(story.status, role);
              const mode = actions.includes('accept') ? 'decide' : actions.includes('convert') ? 'convert' : null;
              return (
                <StoryCard
                  key={story.id}
                  story={story}
                  locale={locale}
                  taskHref={story.status === 'converted' && story.task_id ? `#task-${story.task_id}` : undefined}
                  actions={
                    mode ? (
                      <StoryDecisionSheet
                        mode={mode}
                        locale={locale}
                        story={{
                          id: story.id,
                          title: story.title,
                          client,
                          summary: tSheet('summary', {
                            client,
                            as: story.as_a,
                            want: story.i_want,
                            so: story.so_that,
                            criteria: tSheet('criteria', { count: story.acceptance_criteria.length }),
                          }),
                        }}
                      />
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        </NextIntlClientProvider>
      )}
    </div>
  );
}
