import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PhaseBoard } from "@/components/area/PhaseBoard/PhaseBoard";
import { ProjectGate } from "@/components/area/ProjectGate/ProjectGate";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { boardLabels } from "@/lib/area/labels";
import { fetchBoard, groupByPhase } from "@/lib/area/tasks";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AreaProject } from "@/types/area";

import styles from "../area.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

interface TasksProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: TasksProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("area.tasks.meta.title") };
}

async function BoardRegion({
  locale,
  project,
  userId,
}: {
  locale: Locale;
  project: AreaProject;
  userId: string;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const board = client ? await fetchBoard(client, project.id) : null;
  if (board?.status !== "ok") {
    return (
      <RefreshError
        title={t("area.tasks.error.title")}
        text={t("area.tasks.error.text")}
        retryLabel={t("area.tasks.error.retry")}
        loadingLabel={t("area.tasks.error.retrying")}
      />
    );
  }
  if (board.data.length === 0) {
    return (
      <EmptyState
        headingLevel={2}
        title={t("area.tasks.emptyTitle")}
        text={t("area.tasks.emptyText")}
      />
    );
  }
  return (
    <PhaseBoard
      groups={groupByPhase(board.data)}
      current={project.phase}
      userId={userId}
      taskHref={(id) => `/${locale}/area/tareas/${id}?proyecto=${project.id}`}
      labels={boardLabels(t)}
    />
  );
}

async function TasksContent({
  locale,
  params,
  userId,
}: {
  locale: Locale;
  params: SearchParams;
  userId: string;
}) {
  const t = await getTranslator(locale);
  return (
    <ProjectGate locale={locale} params={params} path="/tareas">
      {(project) => (
        <>
          <header className={styles.head}>
            <Heading level={1} size="h2">
              {t("area.tasks.title")}
            </Heading>
            <p className={styles.lead}>{t("area.tasks.lead")}</p>
          </header>
          <Suspense
            fallback={
              <LoadingRegion
                loading
                label={t("area.tasks.loading")}
                fallback={<Skeleton height="12rem" />}
              >
                {null}
              </LoadingRegion>
            }
          >
            <BoardRegion locale={locale} project={project} userId={userId} />
          </Suspense>
        </>
      )}
    </ProjectGate>
  );
}

export default async function AreaTasksPage({ params, searchParams }: TasksProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("area", locale);
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
              <Skeleton height="12rem" />
            </div>
          }
        >
          {null}
        </LoadingRegion>
      }
    >
      <TasksContent locale={locale} params={query} userId={member.userId} />
    </Suspense>
  );
}
