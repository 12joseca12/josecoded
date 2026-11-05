"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, type Ref, useId } from "react";

import { starterTopicFor } from "@/lib/chat/starters";
import { useChatFixture } from "@/lib/chat/use-chat-fixture";
import type { ChatLabels } from "@/types/chat";

import { ChatView } from "../ChatView/ChatView";

interface ChatSessionProps {
  labels: ChatLabels;
  actions?: ReactNode;
  titleLevel?: 1 | 2;
  inputRef?: Ref<HTMLTextAreaElement>;
}

export function ChatSession({ labels, actions, titleLevel, inputRef }: ChatSessionProps) {
  const titleId = useId();
  const pathname = usePathname();
  const controller = useChatFixture("fresh");
  return (
    <ChatView
      controller={controller}
      labels={labels}
      topic={starterTopicFor(pathname)}
      actions={actions}
      titleId={titleId}
      titleLevel={titleLevel}
      inputRef={inputRef}
    />
  );
}
