import { getTranslations } from 'next-intl/server';

import { AreaCard } from '@/components/area/area-card';
import { StoryCard } from '@/components/stories/story-card';
import { Button } from '@/components/ui/button';

import styles from './stories.module.css';

import type { StoryLinks } from './stories-view';
import type { AreaStory } from '@/lib/area/queries';
import type { Href, Locale } from '@josecoded/types';

/**
 * One story of the client with the verdict (the estimate, the reason when it is left out) and the link to the task it
 * became. Below it says in one sentence what happens next, by status. The card's title is the page's `h1`.
 *
 * A11y: «Volver» is the first link; the sentence about what happens next is a section named by its `h2`.
 */
export async function StoryDetail({
  locale,
  story,
  links,
  back,
}: {
  locale: Locale;
  story: AreaStory;
  links: Pick<StoryLinks, 'task'>;
  /** The list this detail came from. */
  back: Href;
}) {
  const t = await getTranslations({ locale, namespace: 'area.stories' });
  const next = story.status === 'converted' ? 'acceptedTask' : story.status;

  return (
    <>
      <div className={styles.actions}>
        <Button href={back} variant="ghost" size="sm" icon="arrow-left">
          {t('back')}
        </Button>
      </div>
      <StoryCard
        story={story}
        locale={locale}
        audience="client"
        titleAs="h1"
        taskHref={story.task_id ? links.task(story.task_id) : undefined}
      />
      <AreaCard id="story-next" title={t('next.heading')} tone="quiet" span="full">
        <p>{t(`next.${next}`)}</p>
      </AreaCard>
    </>
  );
}
