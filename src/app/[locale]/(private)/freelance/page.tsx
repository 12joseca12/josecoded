import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CounterCell } from "@/components/admin/CounterCell/CounterCell";
import { RecentUpdates } from "@/components/area/RecentUpdates/RecentUpdates";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { FreelanceTodo } from "@/components/freelance/FreelanceTodo/FreelanceTodo";
import { ProjectList } from "@/components/freelance/ProjectList/ProjectList";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { feeLine } from "@/lib/freelance/fee-line";
import { fetchCounters, fetchFeeItems, fetchFeeSummaries } from "@/lib/freelance/fees";
import {
  buildHomeFeed,
  fetchMyOpenTasks,
  fetchNewTeamDocuments,
  milestonesToDeliver,
} from "@/lib/freelance/home";
import { feeCardLabels, projectListLabels, recentLabels, todoLabels } from "@/lib/freelance/labels";
import { fetchFreelanceProjects } from "@/lib/freelance/projects";
import { fetchLatestUpdates } from "@/lib/freelance/updates";
import { formatCents } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { markDeliveredAction } from "./actions";
import styles from "./freelance.module.css";

interface FreelanceHomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FreelanceHomeProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("freelance.home.meta.title") };
}

type Translator = Awaited<ReturnType<typeof getTranslator>>;

function regionError(t: Translator) {
  return (
    <RefreshError
      title={t("freelance.home.error.title")}
      text={t("freelance.home.error.text")}
      retryLabel={t("freelance.home.error.retry")}
      loadingLabel={t("freelance.home.error.retrying")}
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

async function CountersRegion({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const counters = client ? await fetchCounters(client) : null;
  const data = counters?.status === "ok" ? counters.data : {};
  const count = (value: number | undefined) => value ?? null;
  const unknown = t("freelance.home.counters.unknown");
  const cells = [
    {
      key: "projects",
      label: t("freelance.home.counters.projects"),
      value: count(data.projects_active),
    },
    {
      key: "tasks",
      label: t("freelance.home.counters.tasks"),
      value: count(data.tasks_pending),
    },
    {
      key: "owed",
      label: t("freelance.home.counters.owed"),
      value:
        data.fees_owed_amount === undefined ? null : formatCents(data.fees_owed_amount, locale),
      highlight: true,
    },
    {
      key: "toDeliver",
      label: t("freelance.home.counters.toDeliver"),
      value: count(data.items_to_deliver),
    },
  ];
  return (
    <ul className={styles.counters} aria-label={t("freelance.home.counters.label")}>
      {cells.map(({ key, ...cell }) => (
        <CounterCell key={key} cell={cell} unknownLabel={unknown} />
      ))}
    </ul>
  );
}

async function ProjectsRegion({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const result = client ? await fetchFreelanceProjects(client) : null;
  if (result?.status !== "ok") return regionError(t);
  if (result.open.length === 0) {
    const none = result.closed.length === 0;
    return (
      <EmptyState
        headingLevel={2}
        title={t(none ? "freelance.empty.title" : "freelance.empty.noneOpenTitle")}
        text={t(none ? "freelance.empty.text" : "freelance.empty.noneOpenText")}
      />
    );
  }
  const summaries = client ? await fetchFeeSummaries(client) : null;
  const labels = feeCardLabels(t);
  const feeLines: Record<string, string> =
    summaries?.status === "ok"
      ? Object.fromEntries(
          summaries.data
            .filter((summary) => summary.closed_at === null)
            .map((summary) => [
              summary.project_id,
              `${labels.modes[summary.mode]}: ${feeLine(summary, locale, labels)}`,
            ]),
        )
      : {};
  return (
    <section className={styles.section} aria-labelledby="freelance-open">
      <Heading level={2} size="h4" id="freelance-open">
        {t("freelance.home.open")}
      </Heading>
      <ProjectList
        projects={result.open}
        locale={locale}
        labels={projectListLabels(t)}
        hrefFor={(id) => `/${locale}/freelance/proyectos/${id}`}
        feeLines={feeLines}
        headingLevel={3}
      />
    </section>
  );
}

async function TodoRegion({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) return regionError(t);
  const [projects, summaries, items] = await Promise.all([
    fetchFreelanceProjects(client),
    fetchFeeSummaries(client),
    fetchFeeItems(client),
  ]);
  if (projects.status !== "ok" || summaries.status !== "ok" || items.status !== "ok") {
    return regionError(t);
  }
  const tasks = await fetchMyOpenTasks(client, projects.open);
  if (tasks.status !== "ok") return regionError(t);
  return (
    <FreelanceTodo
      tasks={tasks.data}
      milestones={milestonesToDeliver(items.data, summaries.data)}
      projectBase={`/${locale}/freelance/proyectos`}
      deliver={markDeliveredAction.bind(null, locale)}
      labels={todoLabels(t)}
    />
  );
}

async function RecentRegion({ locale, userId }: { locale: Locale; userId: string }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) return regionError(t);
  const [latest, documents, items] = await Promise.all([
    fetchLatestUpdates(client),
    fetchNewTeamDocuments(client),
    fetchFeeItems(client),
  ]);
  if (latest.status !== "ok" || documents.status !== "ok" || items.status !== "ok") {
    return regionError(t);
  }
  const labels = feeCardLabels(t);
  const decided = items.data
    .filter((item) => item.status === "approved" || item.status === "rejected")
    .map((item) => ({ item, statusLabel: labels.statuses[item.status] }));
  const entries = buildHomeFeed(latest.data, documents.data, decided, userId);
  return <RecentUpdates updates={entries} locale={locale} labels={recentLabels(t)} />;
}

export default async function FreelanceHomePage({ params }: FreelanceHomeProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const member = await requireZone("freelance", locale);
  const t = await getTranslator(locale);
  const loading = t("freelance.home.loading");
  return (
    <div className={styles.stack}>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("freelance.home.title")}
        </Heading>
        <p className={styles.lead}>{t("freelance.home.lead")}</p>
      </header>
      <Suspense fallback={<RegionSkeleton label={loading} height="6rem" />}>
        <CountersRegion locale={locale} />
      </Suspense>
      <Suspense fallback={<RegionSkeleton label={loading} height="8rem" />}>
        <ProjectsRegion locale={locale} />
      </Suspense>
      <Suspense fallback={<RegionSkeleton label={loading} height="8rem" />}>
        <TodoRegion locale={locale} />
      </Suspense>
      <Suspense fallback={<RegionSkeleton label={loading} height="6rem" />}>
        <RecentRegion locale={locale} userId={member.userId} />
      </Suspense>
    </div>
  );
}
