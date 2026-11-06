import type { ChatStreamEvent, ChatWireState } from "@/types/chat-visitor";

import type { ChatRpc } from "./rpc";
import { lastCreatedAt, toWireMessages, toWireState } from "./wire";

export interface ChatStreamOptions {
  rpc: ChatRpc;
  tokenHash: string;
  since: string | null;
  signal: AbortSignal;
  pollMs: number;
  maxMs: number;
  pingEveryMs: number;
  reportFailure: (code: string) => void;
}

const maxConsecutiveFailures = 5;

function frame(event: ChatStreamEvent, data: unknown, id?: string): string {
  const lines = [`event: ${event}`, `data: ${JSON.stringify(data)}`];
  if (id) lines.unshift(`id: ${id}`);
  return `${lines.join("\n")}\n\n`;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener("abort", done);
      resolve();
    }
    signal.addEventListener("abort", done, { once: true });
  });
}

function changes(previous: ChatWireState, next: ChatWireState): [ChatStreamEvent, unknown][] {
  const events: [ChatStreamEvent, unknown][] = [];
  if (previous.pendingReply !== next.pendingReply) {
    events.push(["thinking", { pending: next.pendingReply }]);
  }
  if (previous.aiEnabled !== next.aiEnabled)
    events.push(["takeover", { aiEnabled: next.aiEnabled }]);
  if (previous.nexoOnline !== next.nexoOnline)
    events.push(["offline", { nexoOnline: next.nexoOnline }]);
  if (previous.handoffDone !== next.handoffDone)
    events.push(["handoff", { done: next.handoffDone }]);
  if (!previous.closed && next.closed) events.push(["closed", {}]);
  return events;
}

export function chatEventStream(options: ChatStreamOptions): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const stop = new AbortController();
  const signal = AbortSignal.any([options.signal, stop.signal]);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const aborted = () => signal.aborted;
      const write = (text: string) => {
        controller.enqueue(encoder.encode(text));
      };
      write("retry: 3000\n\n");
      const startedAt = Date.now();
      let since = options.since;
      let state: ChatWireState | null = null;
      let failures = 0;
      let quietSince = Date.now();

      while (!aborted() && Date.now() - startedAt < options.maxMs) {
        const outcome = await options.rpc.thread(options.tokenHash, since);
        if (aborted()) break;
        if (!outcome.ok) {
          failures += 1;
          options.reportFailure(outcome.error?.message ?? "stream_unreachable");
          if (failures >= maxConsecutiveFailures) break;
        } else {
          failures = 0;
          const nextState = toWireState(outcome.data);
          const messages = toWireMessages(outcome.data.messages);
          if (state === null) {
            write(frame("ready", { state: nextState }));
          } else {
            for (const [event, data] of changes(state, nextState)) write(frame(event, data));
          }
          const stamp = lastCreatedAt(outcome.data);
          for (const message of messages) write(frame("message", message, message.createdAt));
          if (stamp) since = stamp;
          if (messages.length > 0 || state === null) quietSince = Date.now();
          state = nextState;
          if (nextState.closed) break;
        }
        if (Date.now() - quietSince >= options.pingEveryMs) {
          write(": ping\n\n");
          quietSince = Date.now();
        }
        await wait(options.pollMs, signal);
      }
      stop.abort();
      controller.close();
    },
    cancel() {
      stop.abort();
    },
  });
}
