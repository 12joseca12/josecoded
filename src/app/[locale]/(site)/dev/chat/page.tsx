import { notFound } from "next/navigation";

import { devPagesEnabled } from "@/config/dev";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { chatScenarios } from "@/lib/chat/fixtures";
import { buildChatLabels } from "@/lib/chat/labels";
import { readChatClientConfig } from "@/lib/chat/server/client-config";

import { ChatShowcase } from "./chat-showcase";

export default async function ChatDevPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!devPagesEnabled || !isLocale(locale)) notFound();
  const t = await getTranslator(locale);
  return (
    <ChatShowcase
      locale={locale}
      labels={buildChatLabels(t, locale)}
      config={readChatClientConfig(process.env)}
      scenarios={chatScenarios.map((id) => ({ id, name: t(`dev.chat.scenarios.${id}`) }))}
      copy={{
        title: t("dev.chat.title"),
        scenario: t("dev.chat.scenario"),
        panel: t("dev.chat.panel"),
      }}
    />
  );
}
