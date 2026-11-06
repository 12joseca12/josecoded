import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FileList } from "@/components/area/FileList/FileList";
import { PhaseBoard } from "@/components/area/PhaseBoard/PhaseBoard";
import { PhaseSteps } from "@/components/area/PhaseSteps/PhaseSteps";
import { ProjectHeader } from "@/components/area/ProjectHeader/ProjectHeader";
import { ProjectLinks } from "@/components/area/ProjectLinks/ProjectLinks";
import { Uploader } from "@/components/area/Uploader/Uploader";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { FeeCard } from "@/components/freelance/FeeCard/FeeCard";
import { ProgressLog } from "@/components/freelance/ProgressLog/ProgressLog";
import { TaskStatusMenu } from "@/components/freelance/TaskStatusMenu/TaskStatusMenu";
import { UpdateForm } from "@/components/freelance/UpdateForm/UpdateForm";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Prose } from "@/components/ui/Prose/Prose";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { headerLabels, linksLabels, phaseStepsLabels } from "@/lib/area/labels";
import { fetchLinks } from "@/lib/area/overview";
import { fetchBoard, groupByPhase } from "@/lib/area/tasks";
import { requireZone } from "@/lib/auth/session";
import { fetchProjectDocuments } from "@/lib/documents/project-documents";
import { activeFee, fetchFeeItems, fetchFeeSummaries } from "@/lib/freelance/fees";
import {
  boardLabels,
  feeCardLabels,
  fileLabels,
  progressLogLabels,
  statusMenuLabels,
  updateFormLabels,
  uploaderFreelanceLabels,
} from "@/lib/freelance/labels";
import { fetchFreelanceProject } from "@/lib/freelance/projects";
import { fetchTaskOptions, fetchUpdates } from "@/lib/freelance/updates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FreelanceProject } from "@/types/freelance";

import {
  createUpdateAction,
  deleteItemAction,
  deleteUpdateAction,
  markDeliveredAction,
  setTaskStatusAction,
  setUpdateVisibilityAction,
  submitHoursAction,
} from "../../actions";
import styles from "../../freelance.module.css";

interface ProjectProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: ProjectProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("freelance.project.meta.title") };
}

async function regionError(locale: Locale) {
  const t = await getTranslator(locale);
  return (
    <RefreshError
      title={t("freelance.project.error.title")}
      text={t("freelance.project.error.text")}
      retryLabel={t("freelance.project.error.retry")}
      loadingLabel={t("freelance.project.error.retrying")}
    />
  );
}

function RegionSkeleton({ label, height }: { label: string; height: string }) {
  return (
    <LoadingRegion loading label={label} fallback={<Skeleton height={height} />}>
      {null}
    </LoadingRegion>
  );
}

async function BoardRegion({ locale, project }: { locale: Locale; project: FreelanceProject }) {
  const client = await createSupabaseServerClient();
  const board = client ? await fetchBoard(client, project.id) : null;
  if (board?.status !== "ok") return regionError(locale);
  const t = await getTranslator(locale);
  if (board.data.length === 0) {
    return (
      <EmptyState
        headingLevel={3}
        title={t("freelance.project.tasks.emptyTitle")}
        text={t("freelance.project.tasks.emptyText")}
      />
    );
  }
  const menu = statusMenuLabels(t);
  return (
    <PhaseBoard
      groups={groupByPhase(board.data)}
      current={project.phase}
      labels={boardLabels(t)}
      headingLevel={3}
      renderStatus={(task) =>
        task.assigned_to_me ? (
          <>
            <TaskStatusMenu
              taskId={task.id}
              title={task.title}
              status={task.status}
              change={setTaskStatusAction.bind(null, locale)}
              labels={menu}
            />
            <Link href={`/${locale}/freelance/chat?tarea=${task.id}`} variant="inline">
              {t("freelance.chat.askAboutTask")}
            </Link>
          </>
        ) : null
      }
    />
  );
}

async function FilesRegion({ locale, project }: { locale: Locale; project: FreelanceProject }) {
  const client = await createSupabaseServerClient();
  const documents = client ? await fetchProjectDocuments(client, project.id) : null;
  if (documents?.status !== "ok") return regionError(locale);
  const t = await getTranslator(locale);
  return (
    <FileList
      files={documents.documents}
      variant="freelance"
      locale={locale}
      labels={fileLabels(t)}
    />
  );
}

async function UpdatesRegion({
  locale,
  project,
  userId,
}: {
  locale: Locale;
  project: FreelanceProject;
  userId: string;
}) {
  const client = await createSupabaseServerClient();
  const [updates, tasks] = client
    ? await Promise.all([fetchUpdates(client, project.id), fetchTaskOptions(client, project.id)])
    : [null, null];
  if (updates?.status !== "ok" || tasks?.status !== "ok") return regionError(locale);
  const t = await getTranslator(locale);
  return (
    <ProgressLog
      updates={updates.data}
      userId={userId}
      taskTitles={Object.fromEntries(tasks.data.map((task) => [task.id, task.title]))}
      locale={locale}
      labels={progressLogLabels(t)}
      setVisibility={setUpdateVisibilityAction.bind(null, locale)}
      remove={deleteUpdateAction.bind(null, locale)}
      action={
        <UpdateForm
          projectId={project.id}
          tasks={tasks.data.filter((task) => task.assigned_to_me)}
          labels={updateFormLabels(t)}
          save={createUpdateAction.bind(null, locale)}
        />
      }
    />
  );
}

async function FeeRegion({ locale, project }: { locale: Locale; project: FreelanceProject }) {
  const client = await createSupabaseServerClient();
  const summaries = client ? await fetchFeeSummaries(client, project.id) : null;
  if (summaries?.status !== "ok") return regionError(locale);
  const summary = activeFee(summaries.data) ?? null;
  const items =
    summary === null || client === null ? null : await fetchFeeItems(client, [summary.fee_id]);
  if (items?.status === "error") return regionError(locale);
  const t = await getTranslator(locale);
  return (
    <FeeCard
      projectId={project.id}
      summary={summary}
      items={items?.data ?? []}
      locale={locale}
      today={new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date())}
      labels={feeCardLabels(t)}
      submitHours={submitHoursAction.bind(null, locale)}
      deliver={markDeliveredAction.bind(null, locale)}
      remove={deleteItemAction.bind(null, locale)}
    />
  );
}

async function LinksRegion({ locale, project }: { locale: Locale; project: FreelanceProject }) {
  const client = await createSupabaseServerClient();
  const links = client ? await fetchLinks(client, project.id) : null;
  if (links?.status !== "ok") return regionError(locale);
  const t = await getTranslator(locale);
  return <ProjectLinks links={links.data} labels={linksLabels(t)} />;
}

async function ProjectContent({
  locale,
  id,
  userId,
}: {
  locale: Locale;
  id: string;
  userId: string;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) throw new Error("freelance_project_unavailable");
  const result = await fetchFreelanceProject(client, id);
  if (result.status === "missing") notFound();
  if (result.status === "error") throw new Error("freelance_project_unreadable");
  const { project } = result;
  const loading = t("freelance.project.loading");
  return (
    <AnnouncerProvider>
      <div className={styles.stack}>
        <Link href={`/${locale}/freelance/proyectos`} variant="inline">
          {t("freelance.project.back")}
        </Link>
        <ProjectHeader
          name={project.name}
          offerName={null}
          phaseName={t(`area.phases.${project.phase}`)}
          progress={{ done: project.done, total: project.total, percent: project.percent }}
          labels={headerLabels(t)}
        />
        <div>
          <Button href={`/${locale}/freelance/chat`} variant="light" size="sm">
            {t("freelance.chat.openFromProject")}
          </Button>
        </div>
        <PhaseSteps current={project.phase} labels={phaseStepsLabels(t)} />
        <section className={styles.section} aria-labelledby="freelance-brief">
          <Heading level={2} size="h4" id="freelance-brief">
            {t("freelance.project.brief.title")}
          </Heading>
          {project.brief ? (
            <Prose>
              <p className={styles.brief}>{project.brief}</p>
            </Prose>
          ) : (
            <p className={styles.muted}>{t("freelance.project.brief.empty")}</p>
          )}
        </section>
        <section className={styles.section} aria-labelledby="freelance-tasks">
          <Heading level={2} size="h4" id="freelance-tasks">
            {t("freelance.project.tasks.title")}
          </Heading>
          <Suspense fallback={<RegionSkeleton label={loading} height="12rem" />}>
            <BoardRegion locale={locale} project={project} />
          </Suspense>
        </section>
        <Suspense fallback={<RegionSkeleton label={loading} height="10rem" />}>
          <FeeRegion locale={locale} project={project} />
        </Suspense>
        <Suspense fallback={<RegionSkeleton label={loading} height="8rem" />}>
          <UpdatesRegion locale={locale} project={project} userId={userId} />
        </Suspense>
        <section className={styles.section} aria-labelledby="freelance-files">
          <Heading level={2} size="h4" id="freelance-files">
            {t("freelance.project.files.title")}
          </Heading>
          <Uploader
            projectId={project.id}
            variant="freelance"
            headingLevel={3}
            labels={uploaderFreelanceLabels(t)}
          />
          <Suspense fallback={<RegionSkeleton label={loading} height="8rem" />}>
            <FilesRegion locale={locale} project={project} />
          </Suspense>
        </section>
        <Suspense fallback={<RegionSkeleton label={loading} height="6rem" />}>
          <LinksRegion locale={locale} project={project} />
        </Suspense>
      </div>
    </AnnouncerProvider>
  );
}

export default async function FreelanceProjectPage({ params }: ProjectProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("freelance", locale);
  const t = await getTranslator(locale);
  return (
    <Suspense
      fallback={
        <LoadingRegion
          loading
          label={t("freelance.project.loading")}
          fallback={
            <div className={styles.skeleton}>
              <Skeleton height="2.5rem" />
              <Skeleton height="8rem" />
            </div>
          }
        >
          {null}
        </LoadingRegion>
      }
    >
      <ProjectContent locale={locale} id={id} userId={member.userId} />
    </Suspense>
  );
}
