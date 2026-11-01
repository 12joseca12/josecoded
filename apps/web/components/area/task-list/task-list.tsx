import { getFormatter, getTranslations } from 'next-intl/server';

import { AreaCard, AreaGrid } from '@/components/area/area-card';
import { AreaEmpty } from '@/components/area/area-empty';
import { Action } from '@/components/ui/action';

import styles from './task-list.module.css';

import type { AreaTask } from '@/lib/area/queries';
import type { Locale } from '@josecoded/types';

const ORDER = ['in_progress', 'pending', 'done'] as const;

/**
 * Tasks of the client grouped by state (in progress, pending, done); empty groups are not drawn and
 * no tasks at all shows the empty state. Every row is a link to the detail.
 *
 * A11y: one `section` with `h2` per group, each a list; the link's name is the task title, the due
 * date is plain text inside the row.
 */
export async function TaskList({ locale, tasks }: { locale: Locale; tasks: readonly AreaTask[] }) {
  const t = await getTranslations({ locale, namespace: 'area' });
  const format = await getFormatter({ locale });

  if (tasks.length === 0) {
    return <AreaEmpty title={t('empty.tasksTitle')}>{t('empty.tasksBody')}</AreaEmpty>;
  }

  return (
    <AreaGrid>
      {ORDER.map((status) => {
        const group = tasks.filter((task) => task.status === status);
        if (group.length === 0) return null;
        return (
          <AreaCard key={status} id={`tasks-${status}`} title={t(`tasks.groups.${status}`)}>
            <ul className={styles.list}>
              {group.map((task) => (
                <li key={task.id} className={styles.row}>
                  <Action href={`/area-clientes/tareas/${task.id}`} className={styles.link}>
                    {task.title}
                  </Action>
                  {task.due_at ? (
                    <span className={styles.meta}>
                      {t('tasks.dueOn', {
                        date: format.dateTime(new Date(task.due_at), { dateStyle: 'medium', timeZone: 'Europe/Madrid' }),
                      })}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </AreaCard>
        );
      })}
    </AreaGrid>
  );
}
