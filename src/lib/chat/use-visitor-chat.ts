"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Locale } from "@/i18n/config";
import type {
  ChatController,
  ChatMessage,
  ChatSendError,
  ChatStatus,
  HandoffFieldErrors,
  HandoffInput,
} from "@/types/chat";
import {
  chatWireMessageSchema,
  type ChatWireState,
  type ChatWireThread,
} from "@/types/chat-visitor";

import { fromWire, loadThread, sendHandoff, sendMessage } from "./client";

export const initialChatStatus: ChatStatus = {
  nexoOnline: false,
  aiEnabled: true,
  pendingReply: false,
  handoffDone: false,
  quotaExceeded: false,
  connection: "online",
};

export interface VisitorChatOptions {
  locale: Locale;
  pagePath: string;
  requestToken: () => Promise<string | null>;
  active: boolean;
  initial?: ChatWireThread | null;
  pollMs?: number;
}

const defaultPollMs = 10_000;
const offerAfterMessages = 2;
const maxStreamFailures = 2;

function statusFromWire(wire: ChatWireState, previous: ChatStatus): ChatStatus {
  return {
    ...previous,
    nexoOnline: wire.nexoOnline,
    aiEnabled: wire.aiEnabled,
    pendingReply: wire.pendingReply,
    handoffDone: wire.handoffDone,
  };
}

function merge(current: readonly ChatMessage[], incoming: readonly ChatMessage[]): ChatMessage[] {
  const known = new Set(current.map((message) => message.id));
  const fresh = incoming.filter((message) => !known.has(message.id));
  return fresh.length === 0 ? [...current] : [...current, ...fresh];
}

const sendErrorOf: Record<string, ChatSendError> = {
  invalid: "invalid",
  verification_failed: "verification",
  burst: "burst",
  closed: "closed",
  unavailable: "unavailable",
};

export function useVisitorChat({
  locale,
  pagePath,
  requestToken,
  active,
  initial = null,
  pollMs = defaultPollMs,
}: VisitorChatOptions): ChatController {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initial ? initial.messages.map(fromWire) : [],
  );
  const [status, setStatus] = useState<ChatStatus>(() =>
    initial ? statusFromWire(initial.state, initialChatStatus) : initialChatStatus,
  );
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<ChatSendError | null>(null);
  const [handoffSending, setHandoffSending] = useState(false);
  const [handoffErrors, setHandoffErrors] = useState<HandoffFieldErrors>({});
  const [handoffFailed, setHandoffFailed] = useState(false);
  const [following, setFollowing] = useState(initial !== null && initial.messages.length > 0);
  const counter = useRef(0);
  const lastStamp = useRef<string | null>(initial?.messages.at(-1)?.createdAt ?? null);

  const apply = useCallback((incoming: readonly ChatMessage[]) => {
    const stamp = incoming.at(-1)?.createdAt;
    if (stamp) lastStamp.current = stamp;
    setMessages((current) => merge(current, incoming));
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void loadThread(null).then((thread) => {
      if (cancelled || !thread) return;
      apply(thread.messages.map(fromWire));
      setStatus((current) => statusFromWire(thread.state, current));
      if (thread.messages.length > 0) setFollowing(true);
    });
    return () => {
      cancelled = true;
    };
  }, [active, apply]);

  useEffect(() => {
    if (!active || !following) return;
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = () => {
      void loadThread(lastStamp.current).then((thread) => {
        if (!thread) {
          setStatus((current) => ({ ...current, connection: "reconnecting" }));
          return;
        }
        apply(thread.messages.map(fromWire));
        setStatus((current) => ({
          ...statusFromWire(thread.state, current),
          connection: "online",
        }));
      });
    };

    const startPolling = () => {
      if (timer !== null) return;
      poll();
      timer = setInterval(poll, pollMs);
    };

    if (typeof EventSource === "undefined") {
      startPolling();
    } else {
      source = new EventSource("/api/chat/stream");
      const listen = (name: string, handler: (data: unknown) => void) => {
        source?.addEventListener(name, (event) => {
          try {
            handler(JSON.parse((event as MessageEvent<string>).data) as unknown);
          } catch {
            return;
          }
        });
      };
      const patch = (changes: Partial<ChatStatus>) => {
        setStatus((current) => ({ ...current, ...changes, connection: "online" }));
      };
      let failedAttempts = 0;
      source.onopen = () => {
        failedAttempts = 0;
        setStatus((current) => ({ ...current, connection: "online" }));
      };
      source.onerror = () => {
        failedAttempts += 1;
        if (source?.readyState === EventSource.CLOSED || failedAttempts >= maxStreamFailures) {
          source?.close();
          startPolling();
        } else {
          setStatus((current) => ({ ...current, connection: "reconnecting" }));
        }
      };
      listen("ready", (data) => {
        const state = (data as { state?: ChatWireState }).state;
        if (state)
          setStatus((current) => ({ ...statusFromWire(state, current), connection: "online" }));
      });
      listen("message", (data) => {
        const parsed = chatWireMessageSchema.safeParse(data);
        if (parsed.success) apply([fromWire(parsed.data)]);
      });
      listen("thinking", (data) => {
        patch({ pendingReply: (data as { pending: boolean }).pending });
      });
      listen("takeover", (data) => {
        patch({ aiEnabled: (data as { aiEnabled: boolean }).aiEnabled, pendingReply: false });
      });
      listen("offline", (data) => {
        patch({ nexoOnline: (data as { nexoOnline: boolean }).nexoOnline });
      });
      listen("handoff", (data) => {
        patch({ handoffDone: (data as { done: boolean }).done });
      });
    }

    return () => {
      source?.close();
      if (timer !== null) clearInterval(timer);
    };
  }, [active, following, apply, pollMs]);

  const send = useCallback(
    async (rawBody: string): Promise<boolean> => {
      const body = rawBody.trim();
      if (body === "" || sending) return false;
      setSendError(null);
      setSending(true);
      counter.current += 1;
      const localId = `local-${String(counter.current)}`;
      setMessages((current) => [
        ...current,
        {
          id: localId,
          variant: "visitor",
          body,
          authorName: null,
          sources: [],
          createdAt: "",
          systemEvent: null,
          delivery: "sending",
        },
      ]);
      const drop = () => {
        setMessages((current) => current.filter((message) => message.id !== localId));
      };
      const knownVisitor = following || messages.some((message) => message.variant !== "system");
      let token: string | null = null;
      if (!knownVisitor) {
        token = await requestToken();
        if (token === null) {
          drop();
          setSendError("verification");
          setSending(false);
          return false;
        }
      }
      const result = await sendMessage({
        body,
        locale,
        pagePath,
        ...(token === null ? {} : { turnstileToken: token }),
      });
      setSending(false);
      if (result.status === "sent") {
        setMessages((current) => {
          if (current.some((message) => message.id === result.messageId)) {
            return current.filter((message) => message.id !== localId);
          }
          return current.map((message) =>
            message.id === localId
              ? { ...message, id: result.messageId, delivery: "sent" as const }
              : message,
          );
        });
        setStatus((current) => ({ ...current, pendingReply: current.aiEnabled }));
        setFollowing(true);
        return true;
      }
      drop();
      if (result.status === "quota") {
        setStatus((current) => ({ ...current, quotaExceeded: true }));
      } else {
        setSendError(sendErrorOf[result.status] ?? "unavailable");
      }
      return false;
    },
    [requestToken, following, locale, messages, pagePath, sending],
  );

  const submitHandoff = useCallback(async (input: HandoffInput): Promise<void> => {
    setHandoffSending(true);
    setHandoffErrors({});
    setHandoffFailed(false);
    const result = await sendHandoff(input);
    setHandoffSending(false);
    if (result.status === "saved") {
      setStatus((current) => ({ ...current, handoffDone: true }));
      return;
    }
    if (result.status === "invalid") {
      setHandoffErrors(result.errors);
      return;
    }
    setHandoffFailed(true);
  }, []);

  const dismissSendError = useCallback(() => {
    setSendError(null);
  }, []);

  const visitorMessages = messages.filter((message) => message.variant === "visitor").length;
  const offered =
    visitorMessages > 0 && (!status.nexoOnline || visitorMessages >= offerAfterMessages);
  const handoff = useMemo(
    () => ({
      phase: status.handoffDone
        ? ("done" as const)
        : handoffSending
          ? ("sending" as const)
          : offered
            ? ("offered" as const)
            : ("hidden" as const),
      errors: handoffErrors,
      failed: handoffFailed,
    }),
    [status.handoffDone, handoffSending, offered, handoffErrors, handoffFailed],
  );

  return {
    messages,
    status,
    handoff,
    sending,
    sendError,
    send,
    submitHandoff,
    dismissSendError,
  };
}
