import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AreaRoom } from "@/components/area/AreaRoom/AreaRoom";
import { NexoConsentCard } from "@/components/area/NexoConsentCard/NexoConsentCard";
import { ProjectGate } from "@/components/area/ProjectGate/ProjectGate";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { canWriteInRoom, fetchProjectRoom } from "@/lib/area/chat";
import { consentLabels } from "@/lib/area/labels";
import { requireZone } from "@/lib/auth/session";
import { roomPollMs } from "@/lib/chat/poll";
import { setAiConsentAction } from "@/lib/chat/room-actions";
import { memberListLabels, roomLabels } from "@/lib/chat/room-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AreaProject } from "@/types/area";

import styles from "../area.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

interface ChatProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: ChatProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("area.chat.meta.title") };
}

async function RoomRegion({
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
  const result = client ? await fetchProjectRoom(client, project.id) : null;
  if (result === null || result.status === "error") {
    return (
      <RefreshError
        title={t("area.chat.error.title")}
        text={t("area.chat.error.text")}
        retryLabel={t("area.chat.error.retry")}
        loadingLabel={t("area.chat.error.retrying")}
      />
    );
  }
  if (result.status === "none") {
    return (
      <EmptyState
        headingLevel={2}
        title={t("area.chat.empty.title")}
        text={t("area.chat.empty.text")}
      />
    );
  }
  const { room } = result;
  const consent = room.consent_state === "n/a" ? "pending" : room.consent_state;
  return (
    <AreaRoom
      conversationId={room.id}
      locale={locale}
      userId={userId}
      initial={result.messages}
      members={result.members}
      archived={room.status === "archived"}
      canWrite={canWriteInRoom(result.members, userId)}
      labels={roomLabels(t)}
      memberLabels={memberListLabels(t)}
      pollMs={roomPollMs()}
      consent={
        <NexoConsentCard
          initial={consent}
          labels={consentLabels(t)}
          setConsent={setAiConsentAction.bind(null, room.id)}
        />
      }
    />
  );
}

async function ChatContent({
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
    <ProjectGate locale={locale} params={params} path="/chat">
      {(project) => (
        <>
          <header className={styles.head}>
            <Heading level={1} size="h2">
              {t("area.chat.title")}
            </Heading>
            <p className={styles.lead}>{t("area.chat.lead")}</p>
          </header>
          <Suspense
            fallback={
              <LoadingRegion
                loading
                label={t("area.chat.loading")}
                fallback={<Skeleton height="20rem" />}
              >
                {null}
              </LoadingRegion>
            }
          >
            <RoomRegion locale={locale} project={project} userId={userId} />
          </Suspense>
        </>
      )}
    </ProjectGate>
  );
}

export default async function AreaChatPage({ params, searchParams }: ChatProps) {
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
          label={t("area.chat.loading")}
          fallback={
            <div className={styles.skeleton}>
              <Skeleton height="2.5rem" />
              <Skeleton height="20rem" />
            </div>
          }
        >
          {null}
        </LoadingRegion>
      }
    >
      <ChatContent locale={locale} params={query} userId={member.userId} />
    </Suspense>
  );
}
