import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MemberList } from "@/components/chat/MemberList/MemberList";
import { RoomLive } from "@/components/chat/RoomLive/RoomLive";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { roomPollMs } from "@/lib/chat/poll";
import { memberListLabels, roomLabels } from "@/lib/chat/room-labels";
import { fetchFreelanceChat, fetchTaskTitle, parseUuidParam } from "@/lib/freelance/chat";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "../freelance.module.css";
import chat from "./chat.module.css";

type SearchParams = Record<string, string | string[] | undefined>;

interface ChatProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: ChatProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("freelance.chat.meta.title") };
}

async function ChatSection({
  locale,
  userId,
  taskId,
}: {
  locale: Locale;
  userId: string;
  taskId: string | null;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchFreelanceChat(client);
  if (result.status === "error") {
    return (
      <RefreshError
        title={t("freelance.chat.error.title")}
        text={t("freelance.chat.error.text")}
        retryLabel={t("freelance.chat.error.retry")}
        loadingLabel={t("freelance.chat.error.retrying")}
      />
    );
  }
  const title = taskId === null ? null : await fetchTaskTitle(client, taskId);
  const draft =
    title === null ? undefined : t("freelance.chat.taskDraft").replace("{title}", title);
  return (
    <div className={chat.layout}>
      <div className={chat.room}>
        <RoomLive
          key={result.summary.id}
          conversationId={result.summary.id}
          zone="freelance"
          locale={locale}
          currentUserId={userId}
          initial={result.messages}
          members={result.members}
          archived={result.summary.status === "archived"}
          canWrite
          allowFiles
          draft={draft}
          labels={roomLabels(t)}
          pollMs={roomPollMs()}
        />
      </div>
      <div className={chat.side}>
        <MemberList members={result.members} labels={memberListLabels(t)} />
      </div>
    </div>
  );
}

export default async function FreelanceChatPage({ params, searchParams }: ChatProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const member = await requireZone("freelance", locale);
  const t = await getTranslator(locale);
  return (
    <div className={styles.stack}>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("freelance.chat.title")}
        </Heading>
        <p className={styles.lead}>{t("freelance.chat.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("freelance.chat.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="3rem" />
                <Skeleton height="20rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <ChatSection locale={locale} userId={member.userId} taskId={parseUuidParam(query.tarea)} />
      </Suspense>
    </div>
  );
}
