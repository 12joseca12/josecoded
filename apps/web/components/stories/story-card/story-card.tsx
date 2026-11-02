import { getFormatter, getTranslations } from 'next-intl/server';

import { StatusBadge } from '@/components/shared/status-badge';
import { Action } from '@/components/ui/action';
import { Icon } from '@/components/ui/icon';
import { MONEY_FORMAT } from '@/lib/crm/commissions';
import { storyTone } from '@/lib/stories/status';

import styles from './story-card.module.css';

import type { Locale, StoryStatus } from '@josecoded/types';
import type { ReactNode } from 'react';

/** What a card shows of a story: the text the client wrote, its status and, once decided, the verdict. */
export interface StoryCardData {
  id: string;
  title: string;
  as_a: string;
  i_want: string;
  so_that: string;
  acceptance_criteria: readonly string[];
  status: StoryStatus;
  created_at: string;
  estimate_hours?: number | null;
  estimate_amount?: number | null;
  estimate_note?: string | null;
}

/**
 * A user story: «Como … quiero … para …» with its acceptance criteria as a list with a static check, the status
 * as a badge (the state is always written) and, below, the verdict: the estimate once it is accepted, the reason when it
 * is rejected, the link to the task when it became one. `actions` is what the staff can do with it (the button that
 * opens the decision); the card itself decides nothing.
 *
 * `audience="client"` is the same card read by who wrote it: the status in her words («Pendiente de Jose», one
 * «Aceptada» for an accepted story and for the one already turned into a task). `example` draws it as a sample (a
 * «Ejemplo» badge instead of the status, no date) for the empty state.
 *
 * The card can take the focus (`tabIndex=-1`): after a decision the button that opened the sheet is gone with the old
 * status, and the focus lands here, where the new one is read.
 */
export async function StoryCard({
  story,
  locale,
  actions,
  taskHref,
  audience = 'staff',
  example,
  titleAs: Title = 'h3',
}: {
  story: StoryCardData;
  locale: Locale;
  /** The buttons of the verdict row, for who may decide. */
  actions?: ReactNode;
  /** Where the task born from the story is (`converted`). */
  taskHref?: string;
  /** Whose words the status is told in. */
  audience?: 'staff' | 'client';
  /** Already translated badge text: draws the card as a sample, not as a real story. */
  example?: string;
  /** The heading level of the title: `h1` when the card is the whole screen (the detail of a story). */
  titleAs?: 'h1' | 'h2' | 'h3';
}) {
  const [t, tClients, format] = await Promise.all([
    getTranslations({ locale, namespace: 'stories' }),
    getTranslations({ locale, namespace: 'crmClients.stories' }),
    getFormatter({ locale }),
  ]);
  const hours = story.estimate_hours ?? null;
  const amount = story.estimate_amount ?? null;
  const note = story.estimate_note?.trim() || null;
  const titleId = `story-${story.id}-title`;
  const verdict = story.status === 'accepted' || story.status === 'converted' ? hours !== null : false;
  const hasFooter = Boolean(actions) || verdict || (story.status === 'rejected' && note !== null) || Boolean(taskHref);

  return (
    <article id={`story-${story.id}`} className={styles.story} aria-labelledby={titleId} tabIndex={-1}>
      <div className={styles.head}>
        <Title id={titleId} className={styles.title}>
          {story.title}
        </Title>
        <StatusBadge tone={example ? 'muted' : storyTone(story.status)}>
          {example ?? t(`${audience === 'client' ? 'clientStatus' : 'status'}.${story.status}`)}
        </StatusBadge>
        {example ? null : (
          <span className={styles.date}>
            {format.dateTime(new Date(story.created_at), { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })}
          </span>
        )}
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
          {story.acceptance_criteria.map((criterion, index) => (
            <li key={`${index}-${criterion}`}>
              <Icon name="circle-check" />
              {criterion}
            </li>
          ))}
        </ul>
      ) : null}
      {hasFooter ? (
        <div className={styles.verdict}>
          {verdict && hours !== null ? (
            <span>
              {t.rich(amount !== null ? 'verdict.estimate' : 'verdict.included', {
                hours: format.number(hours, { maximumFractionDigits: 1 }),
                amount: amount !== null ? format.number(amount, MONEY_FORMAT) : '',
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          ) : null}
          {note && story.status !== 'rejected' ? <span className={styles.muted}>{t('verdict.note', { note })}</span> : null}
          {story.status === 'rejected' && note ? <span className={styles.muted}>{t('verdict.reason', { reason: note })}</span> : null}
          {actions}
          {taskHref ? (
            <Action href={taskHref as `#${string}`} className={styles.task}>
              {tClients('viewTask')}
              <Icon name="arrow-right" />
            </Action>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
