"use client";

import { type ReactNode, useEffect, useMemo, useSyncExternalStore } from "react";

import { formatSize } from "@/lib/chat/attachments";
import { useRoomMessages } from "@/lib/chat/use-room-messages";
import type { ChatMessage } from "@/types/chat";
import type { RoomLabels, RoomMember, RoomMessage, RoomTransport, RoomZone } from "@/types/room";

import { ChatThread, type ChatThreadLabels } from "../ChatThread/ChatThread";
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
  allowFiles?: boolean;
  draft?: string;
  labels: RoomLabels;
  transport: RoomTransport;
  pollMs: number;
  header?: ReactNode;
}

const subscribeNever = () => () => undefined;

function variantOf(message: RoomMessage): ChatMessage["variant"] {
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
  allowFiles = false,
  draft,
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

  const threadLabels: ChatThreadLabels = {
    nexoName: labels.authors.nexo,
    you: labels.authors.you,
    jose: labels.authors.someone,
    sourcesLabel: labels.sourcesLabel,
    sending: labels.sending,
    failed: labels.errors.error,
    systemEvents: {
      ai_off: labels.system.ai_off,
      ai_on: labels.system.ai_on,
      handoff_done: labels.system.handoff_done,
      archived: labels.system.archived,
    },
    logLabel: labels.threadLabel,
    typing: "",
  };

  const thread: ChatMessage[] = messages.map((message) => {
    const variant = variantOf(message);
    const own = message.author_id === currentUserId;
    const name = names.get(message.author_id ?? "") ?? "";
    const systemText =
      message.system_event === null
        ? message.body
        : message.system_event === "ai_off" && message.body === "takeover"
          ? labels.system.ai_off_takeover
          : labels.system[message.system_event].replace("{name}", message.body || name);
    return {
      id: message.id,
      variant,
      body: variant === "system" ? systemText : message.body,
      authorName:
        variant === "staff"
          ? own
            ? labels.authors.you
            : name || labels.authors.someone
          : variant === "visitor"
            ? labels.authors.visitor
            : null,
      sources: message.sources,
      createdAt: message.created_at,
      systemEvent: null,
      delivery: "sent",
      own,
      time: zoned ? clock.format(new Date(message.created_at)) : null,
      note: message.auto ? labels.auto : null,
      attachments: message.attachments.map((attachment) => {
        const size = formatSize(attachment.size_bytes, labels.attachments);
        return {
          id: attachment.id,
          href: `/api/chat/attachments/${attachment.id}`,
          name: attachment.name,
          size,
          title: labels.attachments.download
            .replace("{name}", attachment.name)
            .replace("{size}", size),
        };
      }),
    };
  });

  return (
    <div className={styles.room} data-zone={zone} data-ready={zoned ? "true" : "false"}>
      {header ? <div className={styles.header}>{header}</div> : null}
      <div className={styles.body}>
        <ChatThread messages={thread} greeting={null} labels={threadLabels} typing={false}>
          {thread.length === 0 ? <p className={styles.empty}>{labels.empty}</p> : null}
        </ChatThread>
      </div>
      <p className={styles.poll} role="status">
        {pollFailed ? labels.errors.poll : ""}
      </p>
      <RoomComposer
        mode={mode}
        labels={labels}
        allowFiles={allowFiles}
        initialValue={draft}
        onSend={send}
      />
    </div>
  );
}
