import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatSession } from "@/components/chat/ChatPanel/ChatSession";
import { Button } from "@/components/ui/Button/Button";
import { features } from "@/config/features";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { buildChatLabels } from "@/lib/chat/labels";

import styles from "./page.module.css";

interface ChatPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ChatPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || !features.chat) return {};
  const t = await getTranslator(locale);
  return {
    title: t("chat.page.metaTitle"),
    description: t("chat.page.metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { locale } = await params;
  if (!isLocale(locale) || !features.chat) notFound();
  const t = await getTranslator(locale);
  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <ChatSession
          labels={buildChatLabels(t, locale)}
          titleLevel={1}
          actions={
            <Button href={`/${locale}`} variant="quiet" size="sm">
              {t("chat.page.back")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
