import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/types/database";

import { listRoomMembers, listRoomMessages, sendRoomMessage, setConversationAi } from "./room";

const room = "11111111-1111-4111-8111-111111111111";
const user = "22222222-2222-4222-8222-222222222222";

function message(id: string, createdAt: string) {
  return {
    id,
    conversation_id: room,
    author_kind: "human",
    author_id: user,
    kind: "text",
    system_event: null,
    body: "Hola",
    sources: [],
    auto: false,
    created_at: createdAt,
  };
}

interface Result {
  data: unknown;
  error: { code?: string; message: string } | null;
}

function builder(result: Result, calls: string[]) {
  const chain: Record<string, unknown> = {};
  for (const name of ["select", "eq", "order", "limit", "insert", "single"]) {
    chain[name] = (...args: unknown[]) => {
      calls.push(`${name}:${args.map(String).join(",")}`);
      return chain;
    };
  }
  chain.gt = (...args: unknown[]) => {
    calls.push(`gt:${args.map(String).join(",")}`);
    return chain;
  };
  chain.then = (resolve: (value: Result) => unknown) => resolve(result);
  return chain;
}

function clientOf(result: Result, calls: string[] = []) {
  return {
    from: () => builder(result, calls),
    rpc: (name: string, args: unknown) => {
      calls.push(`rpc:${name}:${JSON.stringify(args)}`);
      return Promise.resolve(result);
    },
  } as unknown as SupabaseClient<Database>;
}

describe("listRoomMessages", () => {
  it("reverses the newest page on first load", async () => {
    const rows = [
      message("a1111111-1111-4111-8111-111111111111", "2026-11-05T10:02:00+00:00"),
      message("b1111111-1111-4111-8111-111111111111", "2026-11-05T10:01:00+00:00"),
    ];
    const result = await listRoomMessages(clientOf({ data: rows, error: null }), room, null);
    expect(result.status).toBe("done");
    if (result.status === "done")
      expect(result.messages.map((m) => m.created_at)).toEqual([
        "2026-11-05T10:01:00+00:00",
        "2026-11-05T10:02:00+00:00",
      ]);
  });

  it("asks only for newer messages when a cursor is given", async () => {
    const calls: string[] = [];
    await listRoomMessages(
      clientOf({ data: [], error: null }, calls),
      room,
      "2026-11-05T10:01:00+00:00",
    );
    expect(calls).toContain("gt:created_at,2026-11-05T10:01:00+00:00");
  });

  it("maps privilege errors and malformed rows", async () => {
    expect(
      await listRoomMessages(
        clientOf({ data: null, error: { code: "42501", message: "x" } }),
        room,
        null,
      ),
    ).toEqual({ status: "failed", problem: "forbidden" });
    expect(
      await listRoomMessages(clientOf({ data: [{ id: 1 }], error: null }), room, null),
    ).toEqual({ status: "failed", problem: "error" });
  });
});

describe("sendRoomMessage", () => {
  it("rejects a blank or oversized body before touching the database", async () => {
    const calls: string[] = [];
    const client = clientOf({ data: null, error: null }, calls);
    expect(await sendRoomMessage(client, user, { conversationId: room, body: "   " })).toEqual({
      status: "failed",
      problem: "invalid",
    });
    expect(
      await sendRoomMessage(client, user, { conversationId: room, body: "x".repeat(4001) }),
    ).toEqual({ status: "failed", problem: "invalid" });
    expect(calls).toEqual([]);
  });

  it("inserts as the author and returns the stored row", async () => {
    const row = message("c1111111-1111-4111-8111-111111111111", "2026-11-05T10:03:00+00:00");
    const calls: string[] = [];
    const result = await sendRoomMessage(clientOf({ data: row, error: null }, calls), user, {
      conversationId: room,
      body: " Hola ",
    });
    expect(result).toEqual({ status: "done", message: { ...row, attachments: [] } });
    expect(calls.some((call) => call.startsWith("insert:"))).toBe(true);
  });

  it("reports a privilege error as forbidden", async () => {
    const result = await sendRoomMessage(
      clientOf({ data: null, error: { code: "42501", message: "row-level security" } }),
      user,
      { conversationId: room, body: "Hola" },
    );
    expect(result).toEqual({ status: "failed", problem: "forbidden" });
  });
});

describe("room actions", () => {
  it("returns the typed error code of an rpc", async () => {
    expect(
      await setConversationAi(
        clientOf({ data: null, error: { code: "P0001", message: "conversation_archived" } }),
        room,
        false,
      ),
    ).toEqual({ status: "failed", code: "conversation_archived" });
    expect(await setConversationAi(clientOf({ data: null, error: null }), room, true)).toEqual({
      status: "done",
    });
  });

  it("parses the member list and rejects malformed rows", async () => {
    const member = {
      user_id: user,
      role: "owner",
      full_name: "Jose",
      can_write: true,
      joined_at: "2026-11-05T10:00:00+00:00",
      left_at: null,
    };
    expect(await listRoomMembers(clientOf({ data: [member], error: null }), room)).toEqual([
      member,
    ]);
    expect(
      await listRoomMembers(clientOf({ data: [{ role: "x" }], error: null }), room),
    ).toBeNull();
  });
});
