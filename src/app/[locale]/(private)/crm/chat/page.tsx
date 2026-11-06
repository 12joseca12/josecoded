import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { ConsentBadge } from "@/components/chat/ConsentBadge/ConsentBadge";
import { MemberList } from "@/components/chat/MemberList/MemberList";
import { RoomLive } from "@/components/chat/RoomLive/RoomLive";
import { RefreshError } from "@/components/crm/RefreshError/RefreshError";
import { RoomPicker } from "@/components/crm/RoomPicker/RoomPicker";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { requireZone } from "@/lib/auth/session";
import { roomPollMs } from "@/lib/chat/poll";
import { fetchCrmChat, parseRoomParam } from "@/lib/crm/chat";
import { crmChatLabels } from "@/lib/crm/chat-labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "../crm.module.css";
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
  return { title: t("crm.chat.meta.title") };
}

async function ChatSection({
  locale,
  userId,
  wanted,
}: {
  locale: Locale;
  userId: string;
  wanted: string | null;
}) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchCrmChat(client, wanted);

  if (result.status === "error") {
    return (
      <RefreshError
        title={t("crm.chat.error.title")}
        text={t("crm.chat.error.text")}
        retryLabel={t("crm.chat.error.retry")}
        loadingLabel={t("crm.chat.error.retrying")}
      />
    );
  }

  const labels = crmChatLabels(t);
  const { selected, rooms, ownRoomId } = result;
  const own = rooms.find((room) => room.id === ownRoomId);
  const clients = rooms.filter((room) => room.kind === "client");
  const archived = selected.summary.status === "archived";

  return (
    <div className={chat.layout}>
      <RoomPicker
        own={own}
        clients={clients}
        currentId={selected.summary.id}
        basePath={`/${locale}/crm/chat`}
        labels={labels.picker}
      />
      <div className={chat.room}>
        <RoomLive
          key={selected.summary.id}
          conversationId={selected.summary.id}
          zone="crm"
          locale={locale}
          currentUserId={userId}
          initial={selected.messages}
          members={selected.members}
          archived={archived}
          canWrite
          allowFiles
          labels={labels.room}
          pollMs={roomPollMs()}
        />
      </div>
      <div className={chat.side}>
        <ConsentBadge state={selected.summary.consent_state} labels={labels.consent} />
        <MemberList members={selected.members} labels={labels.members} />
      </div>
    </div>
  );
}

export default async function CrmChatPage({ params, searchParams }: ChatProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const member = await requireZone("crm", locale);
  if (member.role === "admin") redirect(`/${locale}/admin/chat`);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("crm.chat.title")}
        </Heading>
        <p className={styles.lead}>{t("crm.chat.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("crm.chat.loading")}
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
        <ChatSection locale={locale} userId={member.userId} wanted={parseRoomParam(query.sala)} />
      </Suspense>
    </>
  );
}
