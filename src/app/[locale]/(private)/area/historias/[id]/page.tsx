import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProjectGate } from "@/components/area/ProjectGate/ProjectGate";
import { StoryActions } from "@/components/area/StoryActions/StoryActions";
import { StoryCard } from "@/components/area/StoryCard/StoryCard";
import { StoryForm } from "@/components/area/StoryForm/StoryForm";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { readParam } from "@/lib/area/active-project";
import { storyActionsLabels, storyCardLabels, storyFormLabels } from "@/lib/area/labels";
import { fetchStory } from "@/lib/area/stories";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AreaProject } from "@/types/area";

import { confirmStoryAction, deleteStoryAction, updateStoryAction } from "../../actions";
import styles from "../../area.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

interface StoryProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params, searchParams }: StoryProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  const query = await searchParams;
  return {
    title: t(
      readParam(query.editar) === "1" ? "area.stories.meta.edit" : "area.stories.meta.detail",
    ),
  };
}

async function StoryContent({
  locale,
  project,
  id,
  userId,
  editing,
}: {
  locale: Locale;
  project: AreaProject;
  id: string;
  userId: string;
  editing: boolean;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchStory(client, project.id, id);
  if (result.status === "missing") notFound();
  if (result.status === "error") throw new Error("area_story_unreadable");
  const { story } = result;
  const mine = story.author_id === userId;
  const base = `/${locale}/area/historias`;
  const detailHref = `${base}/${story.id}?proyecto=${project.id}`;
  const listHref = `${base}?proyecto=${project.id}`;

  if (editing && mine && story.status === "proposed") {
    return (
      <>
        <header className={styles.head}>
          <Heading level={1} size="h2">
            {t("area.stories.meta.edit")}
          </Heading>
        </header>
        <StoryForm
          initial={{
            title: story.title,
            asA: story.as_a,
            iWant: story.i_want,
            soThat: story.so_that,
            criteria: story.criteria,
          }}
          labels={storyFormLabels(t, "edit")}
          submit={updateStoryAction.bind(null, locale, story.id)}
          successHref={detailHref}
          cancelHref={detailHref}
        />
      </>
    );
  }

  const taskHref = story.task_id
    ? `/${locale}/area/tareas/${story.task_id}?proyecto=${project.id}`
    : null;
  const mode = !mine
    ? null
    : story.status === "proposed"
      ? "manage"
      : story.status === "in_review"
        ? "review"
        : null;
  return (
    <StoryCard
      story={story}
      locale={locale}
      backHref={listHref}
      taskHref={taskHref}
      labels={storyCardLabels(t)}
      actions={
        mode ? (
          <StoryActions
            storyId={story.id}
            mode={mode}
            editHref={`${detailHref}&editar=1`}
            listHref={listHref}
            labels={storyActionsLabels(t)}
            remove={deleteStoryAction.bind(null, locale)}
            decide={confirmStoryAction.bind(null, locale)}
          />
        ) : null
      }
    />
  );
}

export default async function AreaStoryPage({ params, searchParams }: StoryProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("area", locale);
  const t = await getTranslator(locale);
  const query = await searchParams;
  return (
    <Suspense
      fallback={
        <LoadingRegion
          loading
          label={t("area.stories.loading")}
          fallback={
            <div className={styles.skeleton}>
              <Skeleton height="2.5rem" />
              <Skeleton height="10rem" />
            </div>
          }
        >
          {null}
        </LoadingRegion>
      }
    >
      <ProjectGate locale={locale} params={query} path="/historias">
        {(project) => (
          <StoryContent
            locale={locale}
            project={project}
            id={id}
            userId={member.userId}
            editing={readParam(query.editar) === "1"}
          />
        )}
      </ProjectGate>
    </Suspense>
  );
}
