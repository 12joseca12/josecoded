import { ChatInvite } from "@/components/chat/ChatInvite/ChatInvite";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { withResponseTime } from "@/lib/common/response-time";

import styles from "./NexoSection.module.css";

interface NexoSectionProps {
  locale: Locale;
  chat: boolean;
}

const titleId = "nexo-title";

export async function NexoSection({ locale, chat }: NexoSectionProps) {
  if (!chat) return null;

  const t = await getTranslator(locale);

  return (
    <section id="nexo" data-block className={styles.section} aria-labelledby={titleId}>
      <div className={styles.card}>
        <span className={styles.avatar} aria-hidden="true" />
        <div className={styles.body}>
          <h2 id={titleId} className={styles.title}>
            {t("home.nexo.title")}
          </h2>
          <p className={styles.text}>{withResponseTime(t, t("home.chatInvite.hint"))}</p>
          <ChatInvite locale={locale} label={t("home.chatInvite.label")} hint="" variant="action" />
        </div>
      </div>
    </section>
  );
}
