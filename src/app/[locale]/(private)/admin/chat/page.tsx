import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ConversationList } from "@/components/admin/ConversationList/ConversationList";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { FilterTabs } from "@/components/staff/FilterTabs/FilterTabs";
import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import { Heading } from "@/components/ui/Heading/Heading";
import { LoadingRegion } from "@/components/ui/LoadingRegion/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { chatListLimit, countByTab, fetchChatList, parseChatTab, tabOf } from "@/lib/admin/chat";
import { chatTabLabels, conversationListLabels } from "@/lib/admin/chat-labels";
import { requireZone } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type ChatTab, chatTabs } from "@/types/admin-chat";

import styles from "../admin.module.css";

interface ChatProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}

export async function generateMetadata({ params }: ChatProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslator(locale);
  return { title: t("admin.chat.meta.title") };
}

async function ChatSection({ locale, tab }: { locale: Locale; tab: ChatTab }) {
  const t = await getTranslator(locale);
  const client = await createSupabaseServerClient();
  if (client === null) notFound();
  const result = await fetchChatList(client);

  if (result.status === "error") {
    return (
      <LeadsError
        title={t("admin.chat.error.title")}
        text={t("admin.chat.error.text")}
        retryLabel={t("admin.chat.error.retry")}
        loadingLabel={t("admin.chat.error.retrying")}
      />
    );
  }

  const basePath = `/${locale}/admin/chat`;
  const counts = countByTab(result.rooms);
  const labels = chatTabLabels(t);
  const visible = result.rooms.filter((room) => tabOf(room) === tab);

  return (
    <>
      <FilterTabs
        label={t("admin.chat.tabs.label")}
        items={chatTabs.map((key) => ({
          key,
          label: labels[key],
          count: counts[key],
          href: key === "visitors" ? basePath : `${basePath}?tab=${key}`,
          current: key === tab,
        }))}
      />
      {visible.length === 0 ? (
        <EmptyState
          headingLevel={2}
          title={t(`admin.chat.empty.${tab}.title`)}
          text={t(`admin.chat.empty.${tab}.text`)}
        />
      ) : (
        <ConversationList
          rooms={visible}
          locale={locale}
          detailBase={basePath}
          labels={conversationListLabels(t)}
        />
      )}
      {result.rooms.length >= chatListLimit ? (
        <p className={styles.note}>
          {t("admin.chat.limit").replace("{count}", String(chatListLimit))}
        </p>
      ) : null}
    </>
  );
}

export default async function ChatPage({ params, searchParams }: ChatProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireZone("admin", locale);
  const t = await getTranslator(locale);
  return (
    <>
      <header className={styles.head}>
        <Heading level={1} size="h2">
          {t("admin.chat.title")}
        </Heading>
        <p className={styles.lead}>{t("admin.chat.lead")}</p>
      </header>
      <Suspense
        fallback={
          <LoadingRegion
            loading
            label={t("admin.chat.loading")}
            fallback={
              <div className={styles.skeleton}>
                <Skeleton height="4rem" />
                <Skeleton height="4rem" />
                <Skeleton height="4rem" />
              </div>
            }
          >
            {null}
          </LoadingRegion>
        }
      >
        <ChatSection locale={locale} tab={parseChatTab(query.tab)} />
      </Suspense>
    </>
  );
}
