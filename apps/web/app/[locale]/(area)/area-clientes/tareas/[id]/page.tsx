import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { TaskDetail } from '@/components/area/task-detail';
import { getPathname } from '@/i18n/navigation';
import { getAreaContext, getComments, getTask } from '@/lib/area/queries';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import styles from '../../area.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area.tasks' });
  return { title: t('metaTitle') };
}

export default async function TaskPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const { id } = await params;
  const taskId = z.uuid().safeParse(id);
  if (!taskId.success) notFound();

  await requireUser({
    locale,
    next: getPathname({ href: { pathname: '/area-clientes/tareas/[id]', params: { id: taskId.data } }, locale }),
  });
  const context = await getAreaContext();
  if (!context?.client) notFound();

  // a task of another client reads as null (RLS plus the client filter): same 404 as a missing one
  const task = await getTask(context.client.id, taskId.data);
  if (!task) notFound();
  const comments = await getComments(context.client.id, { taskId: task.id, ascending: true });

  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>{task.title}</h1>
      </header>
      <TaskDetail locale={locale} userId={context.session.user.id} task={task} comments={comments} />
    </>
  );
}
