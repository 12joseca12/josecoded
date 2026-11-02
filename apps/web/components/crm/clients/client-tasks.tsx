import { getTranslations } from 'next-intl/server';

import { Icon } from '@/components/ui/icon';

import { DetailCard } from '../detail-card';
import styles from './client-detail.module.css';

import type { StaffRole } from '@/lib/auth/staff';
import type { ClientTask } from '@/lib/crm/client-queries';
import type { Locale } from '@josecoded/types';

/**
 * The tasks of the client's project, to read: the status of each one (the icon is decoration, the word says it) and how
 * many are done. They are managed in the admin's client screen; a closer is told who does it. Each task has an id so
 * a story converted into one can point at it.
 */
export async function ClientTasks({ tasks, role, locale }: { tasks: readonly ClientTask[]; role: StaffRole; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'crmClients.file.tasks' });
  const done = tasks.filter((task) => task.status === 'done').length;
  return (
    <DetailCard icon="list-checks" title={t('title')} badge={tasks.length > 0 ? <span className={styles.caption}>{t('progress', { done, total: tasks.length })}</span> : undefined}>
      {tasks.length === 0 ? (
        <p className={styles.hint}>{t('empty')}</p>
      ) : (
        <ul className={styles.items} role="list">
          {tasks.map((task) => (
            <li key={task.id} id={`task-${task.id}`} className={styles.item} data-done={task.status === 'done' ? '' : undefined}>
              <Icon name={task.status === 'done' ? 'circle-check' : 'circle-dashed'} />
              <span className={styles.name}>{task.title}</span>
              <small className={styles.size}>{t(`status.${task.status}`)}</small>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.hint}>{t(role === 'admin' ? 'hintAdmin' : 'hintCloser')}</p>
    </DetailCard>
  );
}
