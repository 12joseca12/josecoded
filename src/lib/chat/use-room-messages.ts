"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { RoomMessage, RoomTransport, SendProgress, SendRoomMessageResult } from "@/types/room";

const hiddenFactor = 6;

function compare(a: RoomMessage, b: RoomMessage): number {
  const byTime = Date.parse(a.created_at) - Date.parse(b.created_at);
  if (byTime !== 0) return byTime;
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function mergeMessages(current: RoomMessage[], incoming: RoomMessage[]): RoomMessage[] {
  if (incoming.length === 0) return current;
  const known = new Map(current.map((message) => [message.id, message]));
  const fresh = incoming.filter((message) => !known.has(message.id));
  const richer = incoming.filter(
    (message) => (known.get(message.id)?.attachments.length ?? 0) < message.attachments.length,
  );
  if (fresh.length === 0 && richer.length === 0) return current;
  const replaced = new Map(richer.map((message) => [message.id, message]));
  return [...current.map((message) => replaced.get(message.id) ?? message), ...fresh].sort(compare);
}

const overlapMs = 30_000;

export function pollCursor(last: RoomMessage | undefined): string | null {
  if (!last) return null;
  const time = Date.parse(last.created_at);
  return Number.isNaN(time) ? last.created_at : new Date(time - overlapMs).toISOString();
}

interface UseRoomMessagesOptions {
  transport: RoomTransport;
  initial: RoomMessage[];
  pollMs: number;
}

export function useRoomMessages({ transport, initial, pollMs }: UseRoomMessagesOptions) {
  const [messages, setMessages] = useState<RoomMessage[]>(initial);
  const [pollFailed, setPollFailed] = useState(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (stopped) return;
      const wait = document.hidden ? pollMs * hiddenFactor : pollMs;
      timer = setTimeout(() => void tick(), wait);
    };

    const tick = async () => {
      clearTimeout(timer);
      const last = messagesRef.current.at(-1);
      const result = await transport.poll(pollCursor(last));
      if (stopped) return;
      if (result.status === "done") {
        setPollFailed(false);
        setMessages((current) => mergeMessages(current, result.messages));
      } else {
        setPollFailed(true);
      }
      schedule();
    };

    const wake = () => {
      if (document.hidden) return;
      clearTimeout(timer);
      void tick();
    };

    schedule();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
    };
  }, [transport, pollMs]);

  const send = useCallback(
    async (
      body: string,
      files?: File[],
      onProgress?: SendProgress,
    ): Promise<SendRoomMessageResult> => {
      const result = await transport.send(body, files, onProgress);
      if (result.status === "done") {
        setMessages((current) => mergeMessages(current, [result.message]));
      }
      return result;
    },
    [transport],
  );

  return { messages, pollFailed, send };
}
