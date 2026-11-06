import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { ProjectSheet } from "@/components/admin/ProjectSheet/ProjectSheet";
import { ProjectTable } from "@/components/admin/ProjectTable/ProjectTable";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchProjects } from "@/lib/admin/projects";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "../admin.module.css";
import { createProject, updateProject } from "./actions";
import { projectSheetLabels, projectTableLabels } from "./labels";
import page from "./proyectos.module.css";

interface ProjectsProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProjectsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.projects.meta.title") };
}

async function ProjectsSection({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchProjects(client);

  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.projects.error.title")}
        text={t("admin.projects.error.text")}
        retryLabel={t("admin.projects.error.retry")}
        loadingLabel={t("admin.projects.error.retrying")}
      />
    );
  }

  const { rows, options } = result;
  const sheetLabels = projectSheetLabels(t);

  if (rows.length === 0) {
    return (
      <EmptyState
        headingLevel={2}
        title={t("admin.projects.empty.title")}
        text={t("admin.projects.empty.text")}
        action={
          <ProjectSheet
            mode="create"
            options={options}
            labels={sheetLabels}
            submit={createProject.bind(null, locale)}
          />
        }
      />
    );
  }

  return (
    <>
      <div className={page.toolbar}>
        <ProjectSheet
          mode="create"
          options={options}
          labels={sheetLabels}
          submit={createProject.bind(null, locale)}
        />
      </div>
      <section className={page.block}>
        <Heading level={2} size="h4">
          {t("admin.projects.table.title")}
        </Heading>
        <ProjectTable
          rows={rows}
          options={options}
          locale={locale}
          labels={projectTableLabels(t)}
          sheetLabels={sheetLabels}
          update={updateProject.bind(null, locale)}
        />
      </section>
    </>
  );
}

export default async function ProjectsPage({ params }: ProjectsProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.projects.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.projects.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("admin.projects.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <ProjectsSection locale={locale} />
      </Suspense>
    </>
  );
}
