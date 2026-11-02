import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import styles from '@/app/[locale]/(area)/area-clientes/area.module.css'; // the head of the real home
import { AreaGrid } from '@/components/area/area-card';
import { AreaShell } from '@/components/area/area-shell';
import { ContactStrip } from '@/components/area/home/contact-strip';
import { ProjectSummary } from '@/components/area/home/project-summary';
import { StoriesView, StoryDetail, StoryFormScreen } from '@/components/area/stories';
import { TwoToneHeading } from '@/components/ui/two-tone-heading';
import { previewCreateStory } from '@/lib/dev/area-actions';
import {
  PREVIEW_AREA_CLIENT,
  PREVIEW_AREA_NEWS,
  PREVIEW_AREA_TASKS,
  PREVIEW_USER_ID,
  previewStories,
  previewStory,
} from '@/lib/dev/area-fixtures';
import { AREA_STORY_PATH, findAreaStoryState } from '@/lib/dev/area-previews';
import { requireDevUi } from '@/lib/dev/gate';
import { resolveLocale } from '@/lib/locale';

import type { StoryLinks } from '@/components/area/stories';
import type { LocaleParams } from '@/lib/locale';

type Params = Promise<{ locale: string; state: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const BASE = '/dev/area/historias';

const links: StoryLinks = {
  create: `${BASE}/nueva`,
  story: (id) => `${BASE}/detalle?id=${id}`,
  task: (id) => `/area-clientes/tareas/${id}`,
};

/**
 * `/dev/area/historias/<inicio|vacio|lista|nueva|detalle>`: the real components of the client area (the home cell and
 * the stories screens) fed with fixtures and inside the real `AreaShell`. `?id=` picks the story of `detalle`.
 */
export default async function DevAreaStoriesPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  requireDevUi();
  const { state } = await params;
  const locale = await resolveLocale(params as unknown as LocaleParams);
  const preview = findAreaStoryState(state);
  if (!preview) notFound();
  const raw = (await searchParams).id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  return (
    <AreaShell locale={locale} isClient currentPath={AREA_STORY_PATH[preview]}>
      {await screen()}
    </AreaShell>
  );

  async function screen() {
    switch (preview) {
      case 'inicio': {
        const t = await getTranslations({ locale, namespace: 'area.home' });
        const tClient = await getTranslations({ locale, namespace: 'area.home.client' });
        return (
          <>
            <header className={styles.head}>
              <p className={styles.greeting}>{t('greeting', { name: 'Ana' })}</p>
              <TwoToneHeading level="h1" lead={tClient('title.lead')} tail={tClient('title.tail')} />
            </header>
            <AreaGrid>
              <ProjectSummary
                locale={locale}
                userId={PREVIEW_USER_ID}
                client={PREVIEW_AREA_CLIENT}
                tasks={PREVIEW_AREA_TASKS}
                news={PREVIEW_AREA_NEWS}
                stories={previewStories()}
              />
              <ContactStrip locale={locale} />
            </AreaGrid>
          </>
        );
      }
      case 'vacio':
        return <StoriesView locale={locale} stories={[]} links={links} />;
      case 'lista':
        return <StoriesView locale={locale} stories={previewStories()} links={links} />;
      case 'nueva':
        return <StoryFormScreen locale={locale} action={previewCreateStory} back={`${BASE}/lista`} />;
      case 'detalle':
        return <StoryDetail locale={locale} story={previewStory(id)} links={links} back={`${BASE}/lista`} />;
    }
  }
}
