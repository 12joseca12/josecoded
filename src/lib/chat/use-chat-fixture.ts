"use client";

import { useCallback, useMemo, useState } from "react";

import type { ChatController, HandoffState } from "@/types/chat";

import { chatFixture, type ChatScenario } from "./fixtures";

export function useChatFixture(scenario: ChatScenario): ChatController {
  const initial = useMemo(() => chatFixture(scenario), [scenario]);
  const [messages, setMessages] = useState(initial.messages);
  const [status, setStatus] = useState(initial.status);
  const [handoff, setHandoff] = useState<HandoffState>({
    phase: initial.handoff,
    errors: {},
    failed: false,
  });
  const [sendError, setSendError] = useState(initial.sendError);

  const send = useCallback((body: string) => {
    setSendError(null);
    setMessages((current) => [
      ...current,
      {
        id: `local-${String(current.length + 1)}`,
        variant: "visitor",
        body,
        authorName: null,
        sources: [],
        createdAt: new Date().toISOString(),
        systemEvent: null,
        delivery: "sent",
      },
    ]);
    setStatus((current) => ({ ...current, pendingReply: current.nexoOnline && current.aiEnabled }));
    setHandoff((current) =>
      current.phase === "hidden" ? { ...current, phase: "offered" } : current,
    );
    return Promise.resolve(true);
  }, []);

  const submitHandoff = useCallback(() => {
    setHandoff({ phase: "done", errors: {}, failed: false });
    setStatus((current) => ({ ...current, handoffDone: true }));
    return Promise.resolve();
  }, []);

  const dismissSendError = useCallback(() => {
    setSendError(null);
  }, []);

  return {
    messages,
    status,
    handoff,
    sending: false,
    sendError,
    send,
    submitHandoff,
    dismissSendError,
  };
}
