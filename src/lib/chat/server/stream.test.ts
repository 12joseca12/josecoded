import { describe, expect, it } from "vitest";

import type { VisitorThread } from "@/types/chat-visitor";

import type { ChatRpc, RpcResult } from "./rpc";
import { chatEventStream } from "./stream";

function snapshot(partial: Partial<VisitorThread>): VisitorThread {
  return {
    messages: [],
    nexo_online: true,
    ai_enabled: true,
    pending_reply: false,
    handoff_done: false,
    consent_at: null,
    status: "open",
    ...partial,
  };
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text;
    text += decoder.decode(value);
  }
}

describe("chatEventStream", () => {
  it("emits ready, new messages and state transitions, then closes on archive", async () => {
    const steps: VisitorThread[] = [
      snapshot({}),
      snapshot({
        pending_reply: true,
        messages: [
          {
            id: "1",
            author_kind: "human",
            from_staff: false,
            kind: "text",
            system_event: null,
            body: "hola",
            sources: null,
            auto: false,
            created_at: "2026-11-05T12:00:01Z",
          },
        ],
      }),
      snapshot({ ai_enabled: false, nexo_online: false, status: "archived" }),
    ];
    const seen: (string | null)[] = [];
    const rpc: ChatRpc = {
      send: () => Promise.reject(new Error("unused")),
      handoff: () => Promise.reject(new Error("unused")),
      thread: (_hash, since) => {
        seen.push(since);
        const next = steps.shift() ?? steps.at(-1);
        return Promise.resolve<RpcResult<VisitorThread>>({ ok: true, data: next ?? snapshot({}) });
      },
    };
    const text = await readAll(
      chatEventStream({
        rpc,
        tokenHash: "h".repeat(64),
        since: null,
        signal: new AbortController().signal,
        pollMs: 1,
        maxMs: 5000,
        pingEveryMs: 10_000,
        reportFailure: () => undefined,
      }),
    );
    expect(text.startsWith("retry: 3000")).toBe(true);
    expect(text).toContain("event: ready");
    expect(text).toContain('event: thinking\ndata: {"pending":true}');
    expect(text).toContain("id: 2026-11-05T12:00:01Z\nevent: message");
    expect(text).toContain('event: takeover\ndata: {"aiEnabled":false}');
    expect(text).toContain('event: offline\ndata: {"nexoOnline":false}');
    expect(text).toContain("event: closed");
    expect(seen[0]).toBeNull();
    expect(seen[2]).toBe("2026-11-05T12:00:01Z");
  });

  it("stops after repeated failures and when the client leaves", async () => {
    let calls = 0;
    const rpc: ChatRpc = {
      send: () => Promise.reject(new Error("unused")),
      handoff: () => Promise.reject(new Error("unused")),
      thread: () => {
        calls += 1;
        return Promise.resolve<RpcResult<VisitorThread>>({ ok: false, error: null });
      },
    };
    const options = {
      rpc,
      tokenHash: "h".repeat(64),
      since: null,
      pollMs: 1,
      maxMs: 5000,
      pingEveryMs: 10_000,
      reportFailure: () => undefined,
    };
    await readAll(chatEventStream({ ...options, signal: new AbortController().signal }));
    expect(calls).toBe(5);
    const aborted = new AbortController();
    aborted.abort();
    expect(await readAll(chatEventStream({ ...options, signal: aborted.signal }))).toBe(
      "retry: 3000\n\n",
    );
  });
});
