import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

import { StoryDetail } from '@/components/area/stories';
import { getPathname } from '@/i18n/navigation';
import { getAreaContext, getStory } from '@/lib/area/queries';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

type Params = Promise<{ locale: string; id: string }>;

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area.stories' });
  return { title: t('metaTitle') };
}

export default async function StoryPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const { id } = await params;
  const storyId = z.uuid().safeParse(id);
  if (!storyId.success) notFound();

  await requireUser({
    locale,
    next: getPathname({ href: { pathname: '/area-clientes/historias/[id]', params: { id: storyId.data } }, locale }),
  });
  const context = await getAreaContext();
  if (!context?.client) notFound();

  // a story of another client reads as null (RLS plus the client filter): same 404 as a missing one
  const story = await getStory(context.client.id, storyId.data);
  if (!story) notFound();

  return (
    <StoryDetail
      locale={locale}
      story={story}
      back="/area-clientes/historias"
      links={{ task: (taskId) => `/area-clientes/tareas/${taskId}` }}
    />
  );
}
