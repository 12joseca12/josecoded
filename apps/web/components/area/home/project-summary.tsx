import { getFormatter, getTranslations } from 'next-intl/server';

import { AreaCard } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';
import { packLabel } from '@/lib/area/packs';

import styles from './home.module.css';

import type { AreaClient, AreaComment, AreaStory, AreaTask } from '@/lib/area/queries';
import type { Locale } from '@josecoded/types';

const PHASES = ['kickoff', 'design', 'build', 'review', 'delivered', 'maintenance'] as const;

/**
 * Home of a client (variant `client`): where the project is, what is waiting for them, and the
 * latest visible comments. Everything comes through RLS under the client's own session.
 *
 * A11y: the phases are an ordered list; the current one carries `aria-current="step"` and the done
 * ones are told apart by a visually hidden «done» is not needed: the phase list reads in order and
 * the current step is announced; the counters are plain text.
 */
export async function ProjectSummary({
  locale,
  userId,
  client,
  tasks,
  news,
  stories,
}: {
  locale: Locale;
  userId: string;
  client: AreaClient;
  tasks: readonly AreaTask[];
  news: readonly AreaComment[];
  /** The stories she proposed; without them the «Tus historias» cell is not drawn. */
  stories?: readonly Pick<AreaStory, 'status'>[];
}) {
  const t = await getTranslations({ locale, namespace: 'area.home.client' });
  const format = await getFormatter({ locale });
  const date = (value: string) => format.dateTime(new Date(value), { dateStyle: 'medium', timeZone: 'Europe/Madrid' });

  const current = PHASES.indexOf(client.project_phase);
  const waiting = tasks.filter((task) => task.status !== 'done').length;
  const storiesWaiting = stories?.filter((story) => story.status === 'proposed').length ?? 0;
  const storiesAccepted = stories?.filter((story) => story.status === 'accepted' || story.status === 'converted').length ?? 0;
  const taskTitle = new Map(tasks.map((task) => [task.id, task.title]));

  return (
    <>
      <AreaCard id="area-phase" title={t('phaseTitle')} span="full">
        <p className={styles.muted}>{t('phaseOf', { current: current + 1, total: PHASES.length })}</p>
        <ol className={styles.phases}>
          {PHASES.map((phase, index) => (
            <li
              key={phase}
              className={styles.phase}
              data-state={index < current ? 'done' : index === current ? 'current' : 'todo'}
              aria-current={index === current ? 'step' : undefined}
            >
              {t(`phases.${phase}`)}
            </li>
          ))}
        </ol>
        <p className={styles.muted}>
          {packLabel(client.pack_code, locale)}
          {client.starts_at ? ` · ${t('startedOn', { date: date(client.starts_at) })}` : ''}
          {client.delivered_at ? ` · ${t('deliveredOn', { date: date(client.delivered_at) })}` : ''}
        </p>
      </AreaCard>

      <AreaCard id="area-your-turn" title={t('yourTurn')}>
        <p>{waiting > 0 ? t('yourTurnCount', { count: waiting }) : t('yourTurnEmpty')}</p>
        <div className={styles.actions}>
          <Button href="/area-clientes/tareas" variant={waiting > 0 ? 'solid' : 'ghost'}>
            {t('seeTasks')}
          </Button>
        </div>
      </AreaCard>

      {stories ? (
        <AreaCard id="area-stories" title={t('storiesTitle')}>
          {stories.length === 0 ? (
            <p className={styles.muted}>{t('storiesEmpty')}</p>
          ) : (
            <div className={styles.fact}>
              <p className={styles.big}>{t('storiesCount', { count: stories.length })}</p>
              <p className={styles.muted}>
                {t('storiesBreakdown', {
                  waiting: t('storiesWaiting', { count: storiesWaiting }),
                  accepted: t('storiesAccepted', { count: storiesAccepted }),
                })}
              </p>
            </div>
          )}
          <div className={styles.actions}>
            <Button href="/area-clientes/historias" variant="ghost">
              {stories.length === 0 ? t('storiesStart') : t('storiesSee')}
            </Button>
          </div>
        </AreaCard>
      ) : null}

      <AreaCard id="area-news" title={t('news')} span={stories ? 'full' : 'half'}>
        {news.length === 0 ? (
          <p className={styles.muted}>{t('newsEmpty')}</p>
        ) : (
          <ul className={styles.list}>
            {news.map((comment) => (
              <li key={comment.id} className={styles.item}>
                <span>{comment.body}</span>
                <span className={styles.itemMeta}>
                  {comment.task_id && taskTitle.get(comment.task_id)
                    ? `${taskTitle.get(comment.task_id)} · `
                    : ''}
                  {comment.author_user_id === userId
                    ? t('newsSelf', { date: date(comment.created_at) })
                    : t('newsJose', { date: date(comment.created_at) })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AreaCard>
    </>
  );
}
