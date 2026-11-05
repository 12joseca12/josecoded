import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActiveProjectCookie } from "@/components/area/ActiveProjectCookie/ActiveProjectCookie";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { loadActiveProject } from "@/lib/area/load-active-project";
import { requireZone } from "@/lib/auth/session";

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

async function AreaHome({ locale, params }: { locale: Locale; params: SearchParams }) {
  const t = await getTranslator(locale);
  const result = await loadActiveProject(params);
  if (result.status === "error") throw new Error("area_projects_unreadable");
  if (result.active === null) {
    return (
      <EmptyState headingLevel={1} title={t("area.empty.title")} text={t("area.empty.text")} />
    );
  }
  return (
    <>
      <ActiveProjectCookie projectId={result.active.id} />
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {result.active.name}
        </Heading>
      </header>
    </>
  );
}

export default async function AreaHomePage({ params, searchParams }: AreaProps) {
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
      <AreaHome locale={locale} params={query} />
    </Suspense>
  );
}
