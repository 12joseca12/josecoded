"use client";

import { useEffect, useRef } from "react";

import { type ChatRuntimeConfig, ChatSession } from "@/components/chat/ChatPanel/ChatSession";
import type { Locale } from "@/i18n/config";
import { registerChatEmbed } from "@/lib/chat/chat-embed";
import type { ChatLabels } from "@/types/chat";

import styles from "./ChatEmbed.module.css";

interface ChatEmbedProps {
  locale: Locale;
  labels: ChatLabels;
  config: ChatRuntimeConfig;
  title: string;
}

export function ChatEmbed({ locale, labels, config, title }: ChatEmbedProps) {
  const region = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () =>
      registerChatEmbed(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        region.current?.scrollIntoView({
          block: "nearest",
          behavior: reduced ? "auto" : "smooth",
        });
        (input.current ?? region.current)?.focus({ preventScroll: true });
      }),
    [],
  );

  return (
    <section id="chat" ref={region} className={styles.chat} aria-label={title} tabIndex={-1}>
      <ChatSession locale={locale} labels={labels} config={config} active inputRef={input} />
    </section>
  );
}
