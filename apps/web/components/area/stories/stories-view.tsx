import { getTranslations } from 'next-intl/server';

import { AreaEmpty } from '@/components/area/area-empty';
import { StoryCard } from '@/components/stories/story-card';
import { Button } from '@/components/ui/button';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';

import styles from './stories.module.css';

import type { AreaStory } from '@/lib/area/queries';
import type { Href, Locale } from '@josecoded/types';

/** Where the story screens lead: each page decides (the real area or the `/dev` previews). */
export interface StoryLinks {
  /** The form of a new story; without it the «Proponer» button is not drawn (the form is not wired yet). */
  create?: Href;
  story: (id: string) => Href;
  task: (id: string) => Href;
}

const GROUPS = [
  { id: 'proposed', statuses: ['proposed'] },
  { id: 'accepted', statuses: ['accepted', 'converted'] },
  { id: 'rejected', statuses: ['rejected'] },
] as const;

/**
 * «Tus historias» (A8): what the client proposed, grouped by where it stands with Jose (waiting, accepted, left out),
 * each one the shared `StoryCard` told in her words and linked to its detail. With none, the empty state explains
 * what a story is and shows a filled example, so the blank form is not the first thing she meets.
 *
 * A11y: the page's `h1`; one `section` named by its `h2` per group, each a list; the empty example is a card
 * badged «Ejemplo» (not a story of hers); the one violet action is «Proponer una historia».
 */
export async function StoriesView({
  locale,
  stories,
  links,
}: {
  locale: Locale;
  stories: readonly AreaStory[];
  links: StoryLinks;
}) {
  const t = await getTranslations({ locale, namespace: 'area.stories' });
  const example = {
    id: 'example',
    title: t('empty.story.title'),
    as_a: t('empty.story.as_a'),
    i_want: t('empty.story.i_want'),
    so_that: t('empty.story.so_that'),
    acceptance_criteria: [t('empty.story.criteriaOne'), t('empty.story.criteriaTwo')],
    status: 'proposed' as const,
    created_at: new Date(0).toISOString(),
  };

  return (
    <>
      <header className={styles.head}>
        <TwoToneHeading level="h1" lead={t('title.lead')} tail={t('title.tail')} />
        <p className={styles.lede}>{t('lede')}</p>
        {links.create ? (
          <div className={styles.actions}>
            <Button href={links.create}>{t('propose')}</Button>
          </div>
        ) : null}
      </header>

      {stories.length === 0 ? (
        <div className={styles.empty}>
          <AreaEmpty title={t('empty.title')}>{t('empty.body')}</AreaEmpty>
          <StoryCard story={example} locale={locale} audience="client" example={t('empty.example')} />
        </div>
      ) : (
        <div className={styles.groups}>
          {GROUPS.map(({ id, statuses }) => {
            const group = stories.filter((story) => (statuses as readonly string[]).includes(story.status));
            if (group.length === 0) return null;
            return (
              <section key={id} className={styles.group} aria-labelledby={`stories-${id}`}>
                <h2 id={`stories-${id}`} className={styles.groupTitle}>
                  {t(`groups.${id}`)}
                  <span className={styles.count}>{group.length}</span>
                </h2>
                <ul className={styles.cards} role="list">
                  {group.map((story) => (
                    <li key={story.id}>
                      <StoryCard
                        story={story}
                        locale={locale}
                        audience="client"
                        actions={
                          <Button href={links.story(story.id)} variant="ghost" size="sm" aria-label={`${t('open')}: ${story.title}`}>
                            {t('open')}
                          </Button>
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
