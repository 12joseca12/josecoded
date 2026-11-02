import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { StoriesView } from '@/components/area/stories';
import { getPathname } from '@/i18n/navigation';
import { getAreaContext, getStories } from '@/lib/area/queries';
import { requireUser } from '@/lib/auth/guards';
import { resolveLocale } from '@/lib/locale';

import type { LocaleParams } from '@/lib/locale';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: LocaleParams }): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'area.stories' });
  return { title: t('metaTitle') };
}

/**
 * The stories the client proposed (A8). Read-only until B16 wires the form: without `links.create` the «Proponer»
 * button is not drawn, so no link leads to a screen that does not exist yet.
 */
export default async function StoriesPage({ params }: { params: LocaleParams }) {
  const locale = await resolveLocale(params);
  await requireUser({ locale, next: getPathname({ href: '/area-clientes/historias', locale }) });
  const context = await getAreaContext();
  if (!context?.client) notFound(); // not a client: the section does not exist for them
  const stories = await getStories(context.client.id);

  return (
    <StoriesView
      locale={locale}
      stories={stories}
      links={{
        story: (id) => `/area-clientes/historias/${id}`,
        task: (id) => `/area-clientes/tareas/${id}`,
      }}
    />
  );
}
