"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, type Ref, useId } from "react";

import type { Locale } from "@/i18n/config";
import { starterTopicFor } from "@/lib/chat/starters";
import { useChatTurnstile } from "@/lib/chat/use-chat-turnstile";
import { useVisitorChat } from "@/lib/chat/use-visitor-chat";
import type { ContactClientConfig } from "@/lib/contact/env";
import type { ChatLabels } from "@/types/chat";
import type { ChatWireThread } from "@/types/chat-visitor";

import type { PlainSend } from "../ChatComposer/ChatComposer";
import { ChatView } from "../ChatView/ChatView";
import styles from "./ChatSession.module.css";

export interface ChatRuntimeConfig {
  turnstile: ContactClientConfig | null;
  pollMs: number;
}

interface ChatSessionProps {
  locale: Locale;
  labels: ChatLabels;
  config: ChatRuntimeConfig;
  active: boolean;
  initial?: ChatWireThread | null;
  actions?: ReactNode;
  titleLevel?: 1 | 2;
  inputRef?: Ref<HTMLTextAreaElement>;
  plainAction?: PlainSend;
}

export function ChatSession({
  locale,
  labels,
  config,
  active,
  initial,
  actions,
  titleLevel,
  inputRef,
  plainAction,
}: ChatSessionProps) {
  const titleId = useId();
  const pathname = usePathname();
  const { container, request } = useChatTurnstile(config.turnstile, locale);
  const chat = useVisitorChat({
    locale,
    pagePath: pathname,
    requestToken: request,
    pollMs: config.pollMs,
    active,
    initial,
  });
  return (
    <>
      <ChatView
        controller={chat}
        labels={labels}
        topic={starterTopicFor(pathname)}
        actions={actions}
        titleId={titleId}
        titleLevel={titleLevel}
        inputRef={inputRef}
        plainAction={plainAction}
      />
      <div ref={container} className={styles.turnstile} />
    </>
  );
}
