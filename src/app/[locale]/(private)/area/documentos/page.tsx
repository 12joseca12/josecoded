import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FileList } from "@/components/area/FileList/FileList";
import { ProjectGate } from "@/components/area/ProjectGate/ProjectGate";
import { Uploader } from "@/components/area/Uploader/Uploader";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fileListLabels, uploaderLabels } from "@/lib/area/labels";
import { requireZone } from "@/lib/auth/session";
import { fetchProjectDocuments } from "@/lib/documents/project-documents";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AreaProject } from "@/types/area";

import styles from "../area.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

interface DocumentsProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: DocumentsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("area.docs.meta.title") };
}

async function FilesRegion({
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
  const documents = client ? await fetchProjectDocuments(client, project.id) : null;
  if (documents?.status !== "ok") {
    return (
      <RefreshError
        title={t("area.docs.error.title")}
        text={t("area.docs.error.text")}
        retryLabel={t("area.docs.error.retry")}
        loadingLabel={t("area.docs.error.retrying")}
      />
    );
  }
  return (
    <FileList
      files={documents.documents}
      variant="client"
      currentUserId={userId}
      locale={locale}
      labels={fileListLabels(t)}
    />
  );
}

async function DocumentsContent({
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
    <ProjectGate locale={locale} params={params} path="/documentos">
      {(project) => (
        <AnnouncerProvider>
          <header className={styles.head}>
            <Heading level={1} size="h2">
              {t("area.docs.title")}
            </Heading>
            <p className={styles.lead}>{t("area.docs.lead")}</p>
          </header>
          <Uploader
            projectId={project.id}
            variant="client"
            headingLevel={2}
            labels={uploaderLabels(t)}
          />
          <Suspense
            fallback={
              <LoadingRegion
                loading
                label={t("area.docs.loading")}
                fallback={<Skeleton height="8rem" />}
              >
                {null}
              </LoadingRegion>
            }
          >
            <FilesRegion locale={locale} project={project} userId={userId} />
          </Suspense>
        </AnnouncerProvider>
      )}
    </ProjectGate>
  );
}

export default async function AreaDocumentsPage({ params, searchParams }: DocumentsProps) {
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
          label={t("area.docs.loading")}
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
      <DocumentsContent locale={locale} params={query} userId={member.userId} />
    </Suspense>
  );
}
