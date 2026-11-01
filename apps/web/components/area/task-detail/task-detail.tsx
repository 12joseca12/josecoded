import { getFormatter, getTranslations } from 'next-intl/server';

import { AreaCard, AreaGrid } from '@/components/area/area-card';
import { Button } from '@/components/ui/button';

import { TaskCommentForm } from './task-comment-form';
import styles from './task-detail.module.css';

import type { AreaComment, AreaTask } from '@/lib/area/queries';
import type { Locale } from '@josecoded/types';

/**
 * A task with its visible comments (never the internal ones: RLS and the query both leave them out)
 * and the box to answer. Comments are plain text (`white-space: pre-wrap`), never markup.
 *
 * A11y: the task is the page's `h1` (set by the page); comments are an ordered list named by
 * `aria-label`; the textarea is a labelled field of an accessible form; success is announced.
 */
export async function TaskDetail({
  locale,
  userId,
  task,
  comments,
}: {
  locale: Locale;
  userId: string;
  task: AreaTask;
  comments: readonly AreaComment[];
}) {
  const t = await getTranslations({ locale, namespace: 'area.tasks' });
  const format = await getFormatter({ locale });
  const date = (value: string) => format.dateTime(new Date(value), { dateStyle: 'medium', timeZone: 'Europe/Madrid' });

  return (
    <AreaGrid>
      <AreaCard id="task-info" title={t('status')} span="full">
        <p className={styles.status} data-status={task.status}>
          {t(`statusValues.${task.status}`)}
          {task.due_at ? ` · ${t('dueOn', { date: date(task.due_at) })}` : ''}
        </p>
        {task.description ? <p className={styles.text}>{task.description}</p> : null}
        <div className={styles.actions}>
          <Button href="/area-clientes/tareas" variant="ghost">
            {t('back')}
          </Button>
        </div>
      </AreaCard>

      <AreaCard id="task-comments" title={t('comments.title')} span="full">
        {comments.length === 0 ? (
          <p className={styles.muted}>{t('comments.empty')}</p>
        ) : (
          <ol className={styles.comments} aria-label={t('comments.list')}>
            {comments.map((comment) => (
              <li key={comment.id} className={styles.comment} data-own={comment.author_user_id === userId ? 'true' : undefined}>
                <p className={styles.text}>{comment.body}</p>
                <p className={styles.muted}>
                  {t('comments.meta', {
                    who: comment.author_user_id === userId ? t('comments.you') : t('comments.jose'),
                    date: date(comment.created_at),
                  })}
                </p>
              </li>
            ))}
          </ol>
        )}
        <TaskCommentForm
          locale={locale}
          taskId={task.id}
          labels={{
            label: t('comments.form.label'),
            help: t('comments.form.help'),
            submit: t('comments.form.submit'),
            sent: t('comments.form.sent'),
            form: t('comments.title'),
          }}
        />
      </AreaCard>
    </AreaGrid>
  );
}
