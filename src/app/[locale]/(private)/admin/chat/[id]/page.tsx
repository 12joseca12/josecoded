import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ChatRoomPanel } from "@/components/admin/ChatRoomPanel/ChatRoomPanel";
import { CreateLeadSheet } from "@/components/admin/CreateLeadSheet/CreateLeadSheet";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { RoomLive } from "@/components/chat/RoomLive/RoomLive";
import { Heading } from "@/components/ui/Heading/Heading";
import { Link } from "@/components/ui/Link/Link";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchChatDetail } from "@/lib/admin/chat";
import { chatPanelLabels, createLeadLabels } from "@/lib/admin/chat-labels";
import { requireZone } from "@/lib/auth/session";
import { roomPollMs } from "@/lib/chat/poll";
import { staffNav } from "@/lib/staff/nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import styles from "../../admin.module.css";
import { createContactFromChat } from "../actions";
import chat from "../chat.module.css";

interface ChatRoomProps {
  params: Promise<{ locale: string; id: string }>;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: ChatRoomProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.chat.meta.detailTitle") };
}

async function RoomSection({ locale, id, userId }: { locale: Locale; id: string; userId: string }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchChatDetail(client, id);
  if (result.status === "missing") notFound();
  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.chat.detail.error.title")}
        text={t("admin.chat.detail.error.text")}
        retryLabel={t("admin.chat.detail.error.retry")}
        loadingLabel={t("admin.chat.detail.error.retrying")}
      />
    );
  }

  const { summary, conversation, messages, members, candidates, lead } = result;
  const panel = chatPanelLabels(t);
  const archived = conversation.status === "archived";
  const title =
    conversation.kind === "visitor"
      ? t("admin.chat.detail.titleVisitor")
      : conversation.kind === "client"
        ? t("admin.chat.detail.titleClient")
        : t("admin.chat.detail.titleNamed").replace("{name}", summary.counterpart_name ?? "");
  const contacts = staffNav.crm.find((entry) => entry.key === "contacts");
  const contactId = lead?.contact_id ?? conversation.contact_id;
  const contactHref =
    contactId && contacts?.ready ? `/${locale}/crm${contacts.path}/${contactId}` : null;

  return (
    <>
      <header className={styles.head}>
        <Link href={`/${locale}/admin/chat`}>{t("admin.chat.detail.back")}</Link>
        <Heading level={1} size="h2">
          {title}
        </Heading>
        {conversation.first_page_path ? (
          <p className={chat.origin}>
            {t("admin.chat.detail.origin").replace("{path}", conversation.first_page_path)}
          </p>
        ) : null}
        {archived ? (
          <p className={chat.archivedNote}>{t("admin.chat.detail.archivedNote")}</p>
        ) : null}
      </header>
      <div className={chat.layout}>
        <div className={chat.room}>
          <RoomLive
            conversationId={id}
            zone="admin"
            locale={locale}
            currentUserId={userId}
            initial={messages}
            members={members}
            archived={archived}
            canWrite
            labels={panel.room}
            pollMs={roomPollMs()}
          />
        </div>
        <div className={chat.side}>
          <ChatRoomPanel
            conversationId={id}
            kind={conversation.kind}
            archived={archived}
            aiEnabled={conversation.ai_enabled}
            aiOffReason={conversation.ai_off_reason}
            consentState={summary.consent_state}
            members={members}
            candidates={candidates}
            labels={panel}
          />
          {conversation.kind === "visitor" ? (
            <CreateLeadSheet
              lead={lead}
              labels={createLeadLabels(t)}
              leadHref={lead ? `/${locale}/admin/interesados/${lead.id}` : null}
              contactHref={contactHref}
              create={createContactFromChat.bind(null, locale)}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

export default async function ChatRoomPage({ params }: ChatRoomProps) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !uuidPattern.test(id)) notFound();
  const member = await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <Suspense
      fallback={
        <LoadingRegion
          loading
          label={t("admin.chat.loading")}
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
      <RoomSection locale={locale} id={id} userId={member.userId} />
    </Suspense>
  );
}
