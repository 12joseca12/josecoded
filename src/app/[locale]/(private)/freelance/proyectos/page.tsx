import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { ProjectList } from "@/components/freelance/ProjectList/ProjectList";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { projectListLabels } from "@/lib/freelance/labels";
import { fetchFreelanceProjects } from "@/lib/freelance/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "../freelance.module.css";

interface ProjectsProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProjectsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("freelance.projects.meta.title") };
}

async function ProjectsRegion({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  const result = client ? await fetchFreelanceProjects(client) : null;
  if (result?.status !== "ok") {
    return (
      <RefreshError
        title={t("freelance.projects.error.title")}
        text={t("freelance.projects.error.text")}
        retryLabel={t("freelance.projects.error.retry")}
        loadingLabel={t("freelance.projects.error.retrying")}
      />
    );
  }
  if (result.open.length === 0 && result.closed.length === 0) {
    return (
      <EmptyState
        headingLevel={2}
        title={t("freelance.empty.title")}
        text={t("freelance.empty.text")}
      />
    );
  }
  const labels = projectListLabels(t);
  const hrefFor = (id: string) => `/${locale}/freelance/proyectos/${id}`;
  return (
    <>
      {result.open.length > 0 ? (
        <section className={styles.section} aria-labelledby="freelance-open">
          <Heading level={2} size="h4" id="freelance-open">
            {t("freelance.projects.open")}
          </Heading>
          <ProjectList
            projects={result.open}
            locale={locale}
            labels={labels}
            hrefFor={hrefFor}
            headingLevel={3}
          />
        </section>
      ) : null}
      {result.closed.length > 0 ? (
        <section className={styles.section} aria-labelledby="freelance-closed">
          <Heading level={2} size="h4" id="freelance-closed">
            {t("freelance.projects.closedTitle")}
          </Heading>
          <ProjectList
            projects={result.closed}
            locale={locale}
            labels={labels}
            hrefFor={hrefFor}
            headingLevel={3}
          />
        </section>
      ) : null}
    </>
  );
}

export default async function FreelanceProjectsPage({ params }: ProjectsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("freelance", locale);
  const t = await getTranslator(locale);
  return (
    <div className={styles.stack}>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("freelance.projects.title")}
        </Heading>
        <p className={styles.lead}>{t("freelance.projects.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("freelance.projects.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="2rem" />
                <Skeleton height="8rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <ProjectsRegion locale={locale} />
      </Suspense>
    </div>
  );
}
