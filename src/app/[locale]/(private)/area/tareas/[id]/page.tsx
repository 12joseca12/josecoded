import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CompleteTask } from "@/components/area/CompleteTask/CompleteTask";
import { ProjectGate } from "@/components/area/ProjectGate/ProjectGate";
import { TaskDetail } from "@/components/area/TaskDetail/TaskDetail";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { completeTaskLabels, phaseNames, taskDetailLabels } from "@/lib/area/labels";
import { fetchTask } from "@/lib/area/tasks";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AreaProject } from "@/types/area";

import { completeTaskAction } from "../../actions";
import styles from "../../area.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

interface TaskProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: TaskProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("area.tasks.meta.detail") };
}

async function TaskContent({
  locale,
  project,
  id,
}: {
  locale: Locale;
  project: AreaProject;
  id: string;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchTask(client, project.id, id);
  if (result.status === "missing") notFound();
  if (result.status === "error") throw new Error("area_task_unreadable");
  const { task } = result;
  const mine = task.assigned_to_me;
  const doneDate = task.done_at
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Madrid" }).format(
        new Date(task.done_at),
      )
    : null;
  return (
    <TaskDetail
      task={task}
      phaseName={phaseNames(t)[task.phase]}
      backHref={`/${locale}/area/tareas?proyecto=${project.id}`}
      storyHref={
        task.story ? `/${locale}/area/historias/${task.story.id}?proyecto=${project.id}` : null
      }
      doneDate={doneDate}
      mine={mine}
      labels={taskDetailLabels(t)}
      action={
        mine ? (
          <CompleteTask
            taskId={task.id}
            finished={task.status === "done"}
            complete={completeTaskAction.bind(null, locale)}
            labels={completeTaskLabels(t)}
          />
        ) : null
      }
    />
  );
}

export default async function AreaTaskPage({ params, searchParams }: TaskProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("area", locale);
  const t = await getTranslator(locale);
  const query = await searchParams;
  return (
    <Suspense
      fallback={
        <LoadingRegion
          loading
          label={t("area.tasks.loading")}
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
      <ProjectGate locale={locale} params={query} path="/tareas">
        {(project) => <TaskContent locale={locale} project={project} id={id} />}
      </ProjectGate>
    </Suspense>
  );
}
