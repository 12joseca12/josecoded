import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProjectGate } from "@/components/area/ProjectGate/ProjectGate";
import { StoryForm } from "@/components/area/StoryForm/StoryForm";
import { StoryList } from "@/components/area/StoryList/StoryList";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { readParam } from "@/lib/area/active-project";
import { storyFormLabels, storyListLabels } from "@/lib/area/labels";
import { fetchStories } from "@/lib/area/stories";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AreaProject } from "@/types/area";

import { createStoryAction } from "../actions";
import styles from "../area.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

interface StoriesProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params, searchParams }: StoriesProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  const query = await searchParams;
  return {
    title: t(readParam(query.nueva) === "1" ? "area.stories.meta.new" : "area.stories.meta.title"),
  };
}

const emptyDraft = { title: "", asA: "", iWant: "", soThat: "", criteria: [] };

function listHref(locale: string, projectId: string, extra = "") {
  return `/${locale}/area/historias?proyecto=${projectId}${extra}`;
}

async function StoriesRegion({
  locale,
  project,
  sent,
}: {
  locale: Locale;
  project: AreaProject;
  sent: boolean;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const stories = client ? await fetchStories(client, project.id) : null;
  if (stories?.status !== "ok") {
    return (
      <RefreshError
        title={t("area.stories.error.title")}
        text={t("area.stories.error.text")}
        retryLabel={t("area.stories.error.retry")}
        loadingLabel={t("area.stories.error.retrying")}
      />
    );
  }
  const newHref = listHref(locale, project.id, "&nueva=1");
  if (stories.data.length === 0) {
    return (
      <div className={styles.column}>
        <EmptyState
          headingLevel={2}
          title={t("area.stories.empty.title")}
          text={t("area.stories.empty.text")}
          action={<Button href={newHref}>{t("area.stories.empty.cta")}</Button>}
        />
        <aside className={styles.example} aria-label={t("area.stories.empty.example")}>
          <p className={styles.exampleTag}>{t("area.stories.empty.example")}</p>
          <p className={styles.exampleTitle}>{t("area.stories.empty.exampleTitle")}</p>
          <p>
            {t("area.stories.form.asA")} {t("area.stories.empty.exampleAsA")}
          </p>
          <p>
            {t("area.stories.form.iWant")} {t("area.stories.empty.exampleIWant")}
          </p>
          <p>
            {t("area.stories.form.soThat")} {t("area.stories.empty.exampleSoThat")}
          </p>
          <ul>
            <li>{t("area.stories.empty.exampleCriterion1")}</li>
            <li>{t("area.stories.empty.exampleCriterion2")}</li>
          </ul>
        </aside>
      </div>
    );
  }
  return (
    <>
      {sent ? (
        <p className={styles.notice} role="status">
          {t("area.stories.sent")}
        </p>
      ) : null}
      <StoryList
        stories={stories.data}
        locale={locale}
        href={(id) => `/${locale}/area/historias/${id}?proyecto=${project.id}`}
        labels={storyListLabels(t)}
      />
    </>
  );
}

async function StoriesContent({ locale, params }: { locale: Locale; params: SearchParams }) {
  const t = await getTranslator(locale);
  const creating = readParam(params.nueva) === "1";
  const sent = readParam(params.enviada) === "1";
  return (
    <ProjectGate locale={locale} params={params} path="/historias">
      {(project) =>
        creating ? (
          <>
            <header className={styles.head}>
              <Heading level={1} size="h2">
                {t("area.stories.meta.new")}
              </Heading>
            </header>
            <StoryForm
              initial={emptyDraft}
              labels={storyFormLabels(t, "create")}
              submit={createStoryAction.bind(null, locale, project.id)}
              successHref={listHref(locale, project.id, "&enviada=1")}
              cancelHref={listHref(locale, project.id)}
            />
          </>
        ) : (
          <>
            <header className={styles.headRow}>
              <div className={styles.head}>
                <Heading level={1} size="h2">
                  {t("area.stories.title")}
                </Heading>
                <p className={styles.lead}>{t("area.stories.lead")}</p>
              </div>
              <Button href={listHref(locale, project.id, "&nueva=1")}>
                {t("area.stories.new")}
              </Button>
            </header>
            <Suspense
              fallback={
                <LoadingRegion
                  loading
                  label={t("area.stories.loading")}
                  fallback={<Skeleton height="10rem" />}
                >
                  {null}
                </LoadingRegion>
              }
            >
              <StoriesRegion locale={locale} project={project} sent={sent} />
            </Suspense>
          </>
        )
      }
    </ProjectGate>
  );
}

export default async function AreaStoriesPage({ params, searchParams }: StoriesProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("area", locale);
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
      <StoriesContent locale={locale} params={query} />
    </Suspense>
  );
}
