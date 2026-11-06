"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { onOpenChat } from "@/lib/chat/chat-events";
import type { ChatLabels } from "@/types/chat";

const ChatPanel = lazy(() =>
  import("./ChatPanel").then((module) => ({ default: module.ChatPanel })),
);

interface ChatPanelHostProps {
  labels: ChatLabels;
}

export function ChatPanelHost({ labels }: ChatPanelHostProps) {
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
      <ChatPanel labels={labels} openRequest={openRequest} openerRef={opener} />
    </Suspense>
  );
}
