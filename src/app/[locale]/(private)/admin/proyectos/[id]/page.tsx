import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { PhaseBoard } from "@/components/admin/PhaseBoard/PhaseBoard";
import { PriceTabs } from "@/components/admin/PriceTabs/PriceTabs";
import { ProjectHead } from "@/components/admin/ProjectHead/ProjectHead";
import { StoryList } from "@/components/admin/StoryList/StoryList";
import { FileList } from "@/components/area/FileList/FileList";
import { Uploader } from "@/components/area/Uploader/Uploader";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchProject, fetchProjectTasks } from "@/lib/admin/project-detail";
import { fetchProjectStories } from "@/lib/admin/project-stories";
import { projectTabs, tabFromParam } from "@/lib/admin/project-tabs";
import { requireZone } from "@/lib/auth/session";
import { fetchProjectDocuments } from "@/lib/documents/project-documents";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Assignee } from "@/types/admin-project-detail";

import styles from "../../admin.module.css";
import {
  archiveProject,
  decideStory,
  deleteTask,
  moveTask,
  setProjectPhase,
  upsertTask,
} from "../actions";
import {
  fileListLabels,
  phaseBoardLabels,
  projectHeadLabels,
  storyDecisionLabels,
  storyListLabels,
  taskSheetLabels,
  uploaderLabels,
} from "../labels";
import detail from "./detail.module.css";

interface ProjectPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.projects.detail.meta.title") };
}

async function ProjectSection({
  locale,
  id,
  tab,
}: {
  locale: Locale;
  id: string;
  tab: string | undefined;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const [project, tasks] = await Promise.all([
    fetchProject(client, id),
    fetchProjectTasks(client, id),
  ]);

  if (project.status === "missing" || tasks.status === "missing") notFound();
  if (project.status === "error" || tasks.status === "error") {
    return (
      <LeadsError
        title={t("admin.projects.detail.error.title")}
        text={t("admin.projects.detail.error.text")}
        retryLabel={t("admin.projects.detail.error.retry")}
        loadingLabel={t("admin.projects.detail.error.retrying")}
      />
    );
  }

  const row = project.project;
  const current = tabFromParam(tab);
  const stories = current === "stories" ? await fetchProjectStories(client, id) : null;
  const documents = current === "documents" ? await fetchProjectDocuments(client, id) : null;
  const assignees: Assignee[] = [
    ...(row.client_id !== null && row.client_name !== null
      ? [{ id: row.client_id, name: row.client_name }]
      : []),
    ...(row.freelance_id !== null && row.freelance_name !== null
      ? [{ id: row.freelance_id, name: row.freelance_name }]
      : []),
  ];
  const base = `/${locale}/admin/proyectos/${id}`;

  return (
    <div className={detail.stack}>
      <header className={styles.head}>
        <Link href={`/${locale}/admin/proyectos`} className={detail.back}>
          {t("admin.projects.detail.back")}
        </Link>
        <Heading level={1} size="h2">
          {row.name}
        </Heading>
      </header>
      <ProjectHead
        project={row}
        labels={projectHeadLabels(t)}
        setPhase={setProjectPhase.bind(null, locale)}
        archive={archiveProject.bind(null, locale)}
      />
      <section className={detail.brief} aria-labelledby="project-brief">
        <Heading level={2} size="h4" id="project-brief">
          {t("admin.projects.detail.briefTitle")}
        </Heading>
        <p className={detail.briefText}>{tasks.brief ?? t("admin.projects.detail.briefEmpty")}</p>
      </section>
      {projectTabs.length > 1 ? (
        <PriceTabs
          label={t("admin.projects.detail.tabsLabel")}
          currentId={current}
          items={projectTabs.map((entry) => ({
            id: entry.id,
            label:
              entry.id === "stories" && row.stories_to_decide > 0
                ? t("admin.projects.detail.tabs.storiesPending").replace(
                    "{count}",
                    String(row.stories_to_decide),
                  )
                : t(`admin.projects.detail.tabs.${entry.id}`),
            href: `${base}?tab=${entry.param}`,
          }))}
        />
      ) : null}
      {current === "documents" ? (
        documents?.status === "ok" ? (
          <AnnouncerProvider>
            <section
              className={detail.stack}
              aria-label={t("admin.projects.detail.tabs.documents")}
            >
              <Uploader projectId={id} variant="admin" labels={uploaderLabels(t)} />
              <FileList
                files={documents.documents}
                variant="admin"
                locale={locale}
                labels={fileListLabels(t)}
              />
            </section>
          </AnnouncerProvider>
        ) : (
          <LeadsError
            title={t("admin.projects.detail.error.title")}
            text={t("admin.projects.detail.error.text")}
            retryLabel={t("admin.projects.detail.error.retry")}
            loadingLabel={t("admin.projects.detail.error.retrying")}
          />
        )
      ) : current === "stories" ? (
        stories?.status === "ok" ? (
          <AnnouncerProvider>
            <section aria-label={t("admin.projects.detail.tabs.stories")}>
              <StoryList
                stories={stories.stories}
                locale={locale}
                labels={storyListLabels(t)}
                decisionLabels={storyDecisionLabels(t)}
                decide={decideStory.bind(null, locale)}
              />
            </section>
          </AnnouncerProvider>
        ) : (
          <LeadsError
            title={t("admin.projects.detail.error.title")}
            text={t("admin.projects.detail.error.text")}
            retryLabel={t("admin.projects.detail.error.retry")}
            loadingLabel={t("admin.projects.detail.error.retrying")}
          />
        )
      ) : (
        <section aria-label={t("admin.projects.detail.tasks.board.region")}>
          <PhaseBoard
            projectId={id}
            tasks={tasks.tasks}
            assignees={assignees}
            currentPhase={row.phase}
            labels={phaseBoardLabels(t)}
            sheetLabels={taskSheetLabels(t)}
            handlers={{
              save: upsertTask.bind(null, locale),
              remove: deleteTask.bind(null, locale),
              move: moveTask.bind(null, locale),
            }}
          />
        </section>
      )}
    </div>
  );
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !uuidPattern.test(id)) notFound();
  await requireZone("admin", locale);
  const { tab } = await searchParams;
  const t = await getTranslator(locale);
  return (
    <Suspense
      fallback={
        <LoadingRegion
          loading
          label={t("admin.projects.detail.loading")}
          fallback={
            <div className={styles.skeleton}>
              <Skeleton height="3rem" />
              <Skeleton height="6rem" />
              <Skeleton height="12rem" />
            </div>
          }
        >
          {null}
        </LoadingRegion>
      }
    >
      <ProjectSection locale={locale} id={id} tab={tab} />
    </Suspense>
  );
}
