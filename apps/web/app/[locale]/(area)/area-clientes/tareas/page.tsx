import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { TaskList } from '@/components/area/task-list';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { getPathname } from '@/i18n/navigation';
import { getAreaContext, getTasks } from '@/lib/area/queries';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import styles from '../area.module.css';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area.tasks' });
  return { title: t('metaTitle') };
}

export default async function TasksPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireUser({ locale, next: getPathname({ href: '/area-clientes/tareas', locale }) });
  const context = await getAreaContext();
  if (!context?.client) notFound(); // not a client: the section does not exist for them
  const t = await getTranslations({ locale, namespace: 'area.tasks' });
  const tasks = await getTasks(context.client.id);

  return (
    <>
      <header className={styles.head}>
        <TwoToneHeading level="h1" lead={t('title.lead')} tail={t('title.tail')} />
        <p className={styles.lede}>{t('lede')}</p>
      </header>
      <TaskList locale={locale} tasks={tasks} />
    </>
  );
}
