import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatSession } from "@/components/chat/ChatPanel/ChatSession";
import { Button } from "@/components/ui/Button/Button";
import { Link } from "@/components/ui/Link/Link";
import { isLocale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { buildChatLabels } from "@/lib/chat/labels";
import { readChatClientConfig } from "@/lib/chat/server/client-config";
import { loadInitialThread } from "@/lib/chat/server/initial";
import { getFeatures } from "@/lib/settings/features";

import { sendFromForm } from "./actions";
import styles from "./page.module.css";

interface ChatPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: Pick<ChatPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale) || !(await getFeatures()).chat) return {};
  const t = await getTranslator(locale);
  return {
    title: t("chat.page.metaTitle"),
    description: t("chat.page.metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale) || !(await getFeatures()).chat) notFound();
  const [t, initial] = await Promise.all([getTranslator(locale), loadInitialThread()]);
  const labels = buildChatLabels(t, locale);
  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <ChatSession
          locale={locale}
          labels={labels}
          config={readChatClientConfig(process.env)}
          active
          initial={initial}
          titleLevel={1}
          plainAction={{ action: sendFromForm, locale }}
          actions={
            <Button href={`/${locale}`} variant="quiet" size="sm">
              {t("chat.page.back")}
            </Button>
          }
        />
      </div>
      <p className={styles.note}>
        {t("chat.page.alternative")}{" "}
        <Link href={`/${locale}/contacto#formulario`}>{t("chat.page.alternativeLink")}</Link>
      </p>
      {query.error === "1" ? (
        <p className={styles.note} role="alert">
          {t("chat.page.noscriptFailed")}
        </p>
      ) : null}
    </div>
  );
}
