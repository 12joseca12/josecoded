import { Faq } from "@/components/ui/Faq/Faq";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { formAnchor } from "@/lib/contact/ways";
import { type NexoChatLabels, type NexoState, nexoStates } from "@/types/nexo";
import type { FaqItem } from "@/types/services";

import { NexoFaqChat } from "../NexoFaqChat/NexoFaqChat";
import styles from "./FaqWithNexo.module.css";

interface FaqWithNexoProps {
  locale: Locale;
  items: FaqItem[];
}

export async function FaqWithNexo({ locale, items }: FaqWithNexoProps) {
  const t = await getTranslator(locale);
  const states = Object.fromEntries(
    nexoStates.map((state) => [state, t(`chat.nexo.label.${state}`)]),
  ) as Record<NexoState, string>;
  const labels: NexoChatLabels = {
    title: t("nexoChat.title"),
    subtitle: t("nexoChat.subtitle"),
    logLabel: t("nexoChat.logLabel"),
    greeting: t("nexoChat.greeting"),
    suggestionsLabel: t("nexoChat.suggestionsLabel"),
    inputLabel: t("nexoChat.inputLabel"),
    placeholder: t("nexoChat.placeholder"),
    send: t("nexoChat.send"),
    sending: t("nexoChat.sending"),
    typing: t("nexoChat.typing"),
    you: t("nexoChat.you"),
    nexo: t("nexoChat.nexo"),
    fallback: t("nexoChat.fallback"),
    form: t("nexoChat.form"),
    chat: t("nexoChat.chat"),
    states,
  };
  return (
    <div className={styles.wrap}>
      <div className={styles.layout}>
        <div className={styles.faq}>
          <Faq items={items} />
        </div>
        <div className={styles.chat}>
          <NexoFaqChat
            items={items}
            labels={labels}
            locale={locale}
            formHref={`/${locale}/contacto${formAnchor}`}
          />
        </div>
      </div>
    </div>
  );
}
