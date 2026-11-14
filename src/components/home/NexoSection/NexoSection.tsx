import { ChatInvite } from "@/components/chat/ChatInvite/ChatInvite";
import { Button } from "@/components/ui/Button/Button";
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
  const t = await getTranslator(locale);

  return (
    <section id="nexo" data-block className={styles.section} aria-labelledby={titleId}>
      <div className={styles.card}>
        <span className={styles.avatar} aria-hidden="true" />
        <div className={styles.body}>
          <h2 id={titleId} className={styles.title}>
            {t("home.nexo.title")}
          </h2>
          <p className={styles.text}>
            {withResponseTime(t, chat ? t("home.chatInvite.hint") : t("home.closing.lead"))}
          </p>
          {chat ? (
            <ChatInvite
              locale={locale}
              label={t("home.chatInvite.label")}
              hint=""
              variant="action"
            />
          ) : (
            <Button href={`/${locale}/contacto`} variant="light">
              {t("home.closing.cta")}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
