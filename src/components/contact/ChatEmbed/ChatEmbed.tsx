"use client";

import { lazy, Suspense, useEffect, useRef } from "react";

import type { ChatRuntimeConfig } from "@/components/chat/ChatPanel/ChatSession";
import { Link } from "@/components/ui/Link/Link";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import type { Locale } from "@/i18n/config";
import { registerChatEmbed } from "@/lib/chat/chat-embed";
import { closeChat } from "@/lib/chat/chat-events";
import type { ChatLabels } from "@/types/chat";

import styles from "./ChatEmbed.module.css";

const ChatSession = lazy(() =>
  import("@/components/chat/ChatPanel/ChatSession").then((module) => ({
    default: module.ChatSession,
  })),
);

interface ChatEmbedProps {
  locale: Locale;
  labels: ChatLabels;
  config: ChatRuntimeConfig;
  title: string;
}

export function ChatEmbed({ locale, labels, config, title }: ChatEmbedProps) {
  const region = useRef<HTMLElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    closeChat();
    return registerChatEmbed(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      region.current?.scrollIntoView({
        block: "nearest",
        behavior: reduced ? "auto" : "smooth",
      });
      const focus = () => (input.current ?? region.current)?.focus({ preventScroll: true });
      const modal = document.querySelector("dialog:modal");
      if (modal) {
        modal.addEventListener("close", () => requestAnimationFrame(focus), { once: true });
      } else {
        focus();
      }
    });
  }, []);

  return (
    <section id="chat" ref={region} className={styles.chat} aria-label={title} tabIndex={-1}>
      <Suspense
        fallback={
          <div className={styles.skeleton}>
            <Skeleton shape="text" lines={3} />
          </div>
        }
      >
        <ChatSession locale={locale} labels={labels} config={config} active inputRef={input} />
      </Suspense>
      <noscript>
        <p className={styles.plain}>
          <Link href={labels.fullscreenHref}>{labels.fullscreen}</Link>
        </p>
      </noscript>
    </section>
  );
}
