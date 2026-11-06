import { afterEach, describe, expect, it, vi } from "vitest";

import { fromWire, loadThread, sendHandoff, sendMessage } from "./client";

function respond(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chat client", () => {
  it("parses a sent message and maps failures to their status", async () => {
    respond(200, { status: "sent", messageId: "m1" });
    expect(await sendMessage({ body: "hola", locale: "es" })).toEqual({
      status: "sent",
      messageId: "m1",
    });
    respond(429, { status: "burst" });
    expect(await sendMessage({ body: "hola", locale: "es" })).toEqual({ status: "burst" });
  });

  it("treats 404, garbage and network errors as unavailable", async () => {
    respond(404, {});
    expect(await sendMessage({ body: "hola", locale: "es" })).toEqual({ status: "unavailable" });
    respond(200, { nope: true });
    expect(await sendMessage({ body: "hola", locale: "es" })).toEqual({ status: "unavailable" });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    expect(await sendMessage({ body: "hola", locale: "es" })).toEqual({ status: "unavailable" });
    expect(await loadThread(null)).toBeNull();
  });

  it("returns field errors from the handoff", async () => {
    respond(400, { status: "invalid", errors: { email: "email_invalid" } });
    expect(await sendHandoff({ email: "x", consent: true })).toEqual({
      status: "invalid",
      errors: { email: "email_invalid" },
    });
  });

  it("loads a thread and maps wire messages to the UI shape", async () => {
    const wire = {
      messages: [
        { id: "1", author: "staff", body: "hola", sources: [], systemEvent: null, createdAt: "t" },
      ],
      state: {
        nexoOnline: true,
        aiEnabled: false,
        pendingReply: false,
        handoffDone: false,
        closed: false,
      },
    };
    respond(200, wire);
    const thread = await loadThread("2026-11-05T10:00:00Z");
    expect(thread?.state.aiEnabled).toBe(false);
    const first = thread?.messages[0];
    expect(first && fromWire(first)).toMatchObject({
      variant: "staff",
      delivery: "sent",
      authorName: null,
    });
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "/api/chat/thread?since=2026-11-05T10%3A00%3A00Z",
    );
  });
});
