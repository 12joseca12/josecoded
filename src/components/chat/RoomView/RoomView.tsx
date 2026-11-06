"use client";

import { type ReactNode, useEffect, useMemo, useSyncExternalStore } from "react";

import { useRoomMessages } from "@/lib/chat/use-room-messages";
import type { RoomLabels, RoomMember, RoomMessage, RoomTransport, RoomZone } from "@/types/room";

import { type BubbleVariant, ChatBubble } from "../ChatBubble/ChatBubble";
import { ChatThread } from "../ChatThread/ChatThread";
import { type ComposerMode, RoomComposer } from "../RoomComposer/RoomComposer";
import styles from "./RoomView.module.css";

interface RoomViewProps {
  zone: RoomZone;
  locale: string;
  currentUserId: string;
  initial: RoomMessage[];
  members: RoomMember[];
  archived: boolean;
  canWrite: boolean;
  labels: RoomLabels;
  transport: RoomTransport;
  pollMs: number;
  header?: ReactNode;
}

const subscribeNever = () => () => undefined;

function variantOf(message: RoomMessage): BubbleVariant {
  if (message.author_kind === "system") return "system";
  if (message.author_kind === "nexo") return "nexo";
  return message.author_id === null ? "visitor" : "staff";
}

export function RoomView({
  zone,
  locale,
  currentUserId,
  initial,
  members,
  archived,
  canWrite,
  labels,
  transport,
  pollMs,
  header,
}: RoomViewProps) {
  const { messages, pollFailed, send } = useRoomMessages({ transport, initial, pollMs });
  const zoned = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const names = useMemo(
    () => new Map(members.map((member) => [member.user_id, member.full_name])),
    [members],
  );
  const clock = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    [locale],
  );

  const lastForeign = messages.findLast(
    (message) => message.author_kind !== "system" && message.author_id !== currentUserId,
  )?.id;

  useEffect(() => {
    if (!lastForeign) return;
    const mark = () => {
      if (!document.hidden) void transport.markRead();
    };
    mark();
    window.addEventListener("focus", mark);
    return () => {
      window.removeEventListener("focus", mark);
    };
  }, [lastForeign, transport]);

  const mode: ComposerMode = archived ? "archived" : canWrite ? "open" : "readOnly";

  return (
    <div className={styles.room} data-zone={zone}>
      {header ? <div className={styles.header}>{header}</div> : null}
      <div className={styles.body}>
        <ChatThread label={labels.threadLabel} empty={labels.empty} count={messages.length}>
          {messages.map((message) => {
            const variant = variantOf(message);
            const own = message.author_id === currentUserId;
            const author =
              variant === "nexo"
                ? labels.authors.nexo
                : variant === "visitor"
                  ? labels.authors.visitor
                  : own
                    ? labels.authors.you
                    : (names.get(message.author_id ?? "") ?? labels.authors.someone);
            const time = zoned ? (
              <time dateTime={message.created_at}>
                {clock.format(new Date(message.created_at))}
              </time>
            ) : null;
            const name = names.get(message.author_id ?? "") ?? "";
            const systemText =
              message.system_event === null
                ? ""
                : message.system_event === "ai_off" && message.body === "takeover"
                  ? labels.system.ai_off_takeover
                  : labels.system[message.system_event].replace("{name}", message.body || name);
            return (
              <li key={message.id}>
                <ChatBubble
                  variant={variant}
                  own={own}
                  author={author}
                  time={time}
                  note={message.auto ? labels.auto : undefined}
                  sources={message.sources}
                >
                  {variant === "system" ? systemText : message.body}
                </ChatBubble>
              </li>
            );
          })}
        </ChatThread>
      </div>
      <p className={styles.poll} role="status">
        {pollFailed ? labels.errors.poll : ""}
      </p>
      <RoomComposer mode={mode} labels={labels} onSend={send} />
    </div>
  );
}
