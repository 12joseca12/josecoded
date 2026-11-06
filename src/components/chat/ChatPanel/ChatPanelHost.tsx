"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

import type { Locale } from "@/i18n/config";
import { onOpenChat } from "@/lib/chat/chat-events";
import type { ChatLabels } from "@/types/chat";

import type { ChatRuntimeConfig } from "./ChatSession";

const ChatPanel = lazy(() =>
  import("./ChatPanel").then((module) => ({ default: module.ChatPanel })),
);

interface ChatPanelHostProps {
  locale: Locale;
  labels: ChatLabels;
  config: ChatRuntimeConfig;
}

export function ChatPanelHost({ locale, labels, config }: ChatPanelHostProps) {
  const [openRequest, setOpenRequest] = useState(0);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(
    () =>
      onOpenChat(() => {
        if (opener.current === null && document.activeElement instanceof HTMLElement) {
          opener.current = document.activeElement;
        }
        setOpenRequest((count) => count + 1);
      }),
    [],
  );

  if (openRequest === 0) return null;
  return (
    <Suspense fallback={null}>
      <ChatPanel
        locale={locale}
        labels={labels}
        config={config}
        openRequest={openRequest}
        openerRef={opener}
      />
    </Suspense>
  );
}
