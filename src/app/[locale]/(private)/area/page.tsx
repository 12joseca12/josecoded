import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PhaseSteps } from "@/components/area/PhaseSteps/PhaseSteps";
import { ProjectGate } from "@/components/area/ProjectGate/ProjectGate";
import { ProjectHeader } from "@/components/area/ProjectHeader/ProjectHeader";
import { ProjectLinks } from "@/components/area/ProjectLinks/ProjectLinks";
import { RecentUpdates } from "@/components/area/RecentUpdates/RecentUpdates";
import { TodoForYou } from "@/components/area/TodoForYou/TodoForYou";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import type { MessageKey } from "@/i18n/keys.generated";
import { getTranslator } from "@/i18n/messages";
import {
  headerLabels,
  linksLabels,
  phaseNames,
  phaseStepsLabels,
  recentLabels,
  todoLabels,
} from "@/lib/area/labels";
import { fetchLinks, fetchProgress, fetchRecentUpdates, fetchTodo } from "@/lib/area/overview";
import { requireZone } from "@/lib/auth/session";
import { offerSlugs } from "@/lib/services/offers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AreaProject } from "@/types/area";

import { completeTaskAction, confirmStoryAction } from "./actions";
import styles from "./area.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

interface AreaProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: AreaProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("area.home.meta.title") };
}

interface RegionProps {
  locale: Locale;
  project: AreaProject;
}

async function regionError(locale: Locale) {
  const t = await getTranslator(locale);
  return (
    <RefreshError
      title={t("area.home.error.title")}
      text={t("area.home.error.text")}
      retryLabel={t("area.home.error.retry")}
      loadingLabel={t("area.home.error.retrying")}
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

async function HeaderRegion({ locale, project }: RegionProps) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const progress = client ? await fetchProgress(client, project.id) : null;
  const offerName =
    project.offer_slug && offerSlugs.some((slug) => slug === project.offer_slug)
      ? t(`offersPage.tiers.${project.offer_slug}.name` as MessageKey)
      : null;
  return (
    <ProjectHeader
      name={project.name}
      offerName={offerName}
      phaseName={phaseNames(t)[project.phase]}
      progress={progress?.status === "ok" ? progress.data : null}
      labels={headerLabels(t)}
    />
  );
}

async function TodoRegion({ locale, project, userId }: RegionProps & { userId: string }) {
  const client = await createSupabaseServerClient();
  const todo = client ? await fetchTodo(client, project.id, userId) : null;
  if (todo?.status !== "ok") return regionError(locale);
  const t = await getTranslator(locale);
  return (
    <TodoForYou
      tasks={todo.data.tasks}
      stories={todo.data.stories}
      locale={locale}
      labels={todoLabels(t)}
      complete={completeTaskAction.bind(null, locale)}
      decide={confirmStoryAction.bind(null, locale)}
    />
  );
}

async function LinksRegion({ locale, project }: RegionProps) {
  const client = await createSupabaseServerClient();
  const links = client ? await fetchLinks(client, project.id) : null;
  if (links?.status !== "ok") return regionError(locale);
  const t = await getTranslator(locale);
  return <ProjectLinks links={links.data} labels={linksLabels(t)} />;
}

async function RecentRegion({ locale, project }: RegionProps) {
  const client = await createSupabaseServerClient();
  const updates = client ? await fetchRecentUpdates(client, project.id) : null;
  if (updates?.status !== "ok") return regionError(locale);
  const t = await getTranslator(locale);
  return <RecentUpdates updates={updates.data} locale={locale} labels={recentLabels(t)} />;
}

async function AreaHome({
  locale,
  params,
  userId,
}: {
  locale: Locale;
  params: SearchParams;
  userId: string;
}) {
  const t = await getTranslator(locale);
  const loading = t("area.home.loading");
  return (
    <ProjectGate locale={locale} params={params} path="">
      {(active) => (
        <>
          <Suspense fallback={<RegionSkeleton label={loading} height="6rem" />}>
            <HeaderRegion locale={locale} project={active} />
          </Suspense>
          <PhaseSteps current={active.phase} labels={phaseStepsLabels(t)} />
          <div className={styles.columns}>
            <div className={styles.column}>
              <Suspense fallback={<RegionSkeleton label={loading} height="10rem" />}>
                <TodoRegion locale={locale} project={active} userId={userId} />
              </Suspense>
              <Suspense fallback={<RegionSkeleton label={loading} height="10rem" />}>
                <RecentRegion locale={locale} project={active} />
              </Suspense>
            </div>
            <div className={styles.column}>
              <Suspense fallback={<RegionSkeleton label={loading} height="8rem" />}>
                <LinksRegion locale={locale} project={active} />
              </Suspense>
            </div>
          </div>
        </>
      )}
    </ProjectGate>
  );
}

export default async function AreaHomePage({ params, searchParams }: AreaProps) {
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
          label={t("area.home.loading")}
          fallback={
            <div className={styles.skeleton}>
              <Skeleton height="2.5rem" />
              <Skeleton height="6rem" />
            </div>
          }
        >
          {null}
        </LoadingRegion>
      }
    >
      <AreaHome locale={locale} params={query} userId={member.userId} />
    </Suspense>
  );
}
