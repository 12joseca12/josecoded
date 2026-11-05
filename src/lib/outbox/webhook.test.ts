import { describe, expect, it, vi } from "vitest";

import { getTranslator } from "@/i18n/messages";
import type { OutboxConfig } from "@/types/outbox";

import { handleTelegramUpdate, readStart } from "./webhook";

const config: OutboxConfig = {
  resend: null,
  telegram: { token: "1:t", baseUrl: "https://telegram.test" },
};

function update(text: string | undefined, chat = { id: 4242, type: "private" }) {
  return { update_id: 1, message: { message_id: 1, text, chat } };
}

function setup(result: { data?: unknown; error?: { message?: string; code?: string } | null }) {
  const rpc = vi.fn().mockResolvedValue({ data: result.data ?? null, error: result.error ?? null });
  const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })));
  const run = (raw: unknown, reply = true) =>
    handleTelegramUpdate(raw, {
      client: { rpc } as never,
      config,
      reply,
      translators: getTranslator,
      fetchImpl: fetchImpl,
    });
  return { run, rpc, fetchImpl };
}

function sentText(fetchImpl: ReturnType<typeof vi.fn>): string {
  const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
  return (JSON.parse(init.body as string) as { text: string }).text;
}

describe("readStart", () => {
  it("reads the code of a /start command", () => {
    expect(readStart("/start ab23cd")).toEqual({ code: "ab23cd" });
    expect(readStart("/start@josecoded_bot AB23CD")).toEqual({ code: "AB23CD" });
    expect(readStart("  /start   AB23CD  ")).toEqual({ code: "AB23CD" });
  });

  it("reports a /start without a code", () => {
    expect(readStart("/start")).toEqual({ code: null });
    expect(readStart("/start@josecoded_bot")).toEqual({ code: null });
  });

  it("ignores anything else", () => {
    expect(readStart("hola")).toBeNull();
    expect(readStart("/help")).toBeNull();
    expect(readStart("/startup AB23CD")).toBeNull();
    expect(readStart(undefined)).toBeNull();
  });
});

describe("handleTelegramUpdate", () => {
  it("links the chat with the upper-cased code and confirms in the chat", async () => {
    const { run, rpc, fetchImpl } = setup({ data: "10000000-0000-4000-8000-000000000001" });
    expect(await run(update("/start ab23cd"))).toBe("linked");
    expect(rpc).toHaveBeenCalledWith("telegram_confirm_link", {
      p_code: "AB23CD",
      p_chat_id: 4242,
    });
    expect(sentText(fetchImpl)).toContain("Telegram vinculado");
  });

  it("does not reply when sending is off", async () => {
    const { run, fetchImpl } = setup({ data: "id" });
    expect(await run(update("/start AB23CD"), false)).toBe("linked");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports an invalid or expired code from the database", async () => {
    const { run, fetchImpl } = setup({
      error: { message: "code_invalid_or_expired", code: "P0001" },
    });
    expect(await run(update("/start AB23CD"))).toBe("invalid");
    expect(sentText(fetchImpl)).toContain("no es válido");
  });

  it("does not even call the database for a code of the wrong shape", async () => {
    const { run, rpc } = setup({});
    expect(await run(update("/start 123"))).toBe("invalid");
    expect(await run(update("/start AB23C1"))).toBe("invalid");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reports a chat that is already linked to someone else", async () => {
    const { run, fetchImpl } = setup({ error: { message: "chat_already_linked", code: "P0001" } });
    expect(await run(update("/start AB23CD"))).toBe("taken");
    expect(sentText(fetchImpl)).toContain("ya está vinculado");
  });

  it("explains how to link when /start comes without a code", async () => {
    const { run, rpc, fetchImpl } = setup({});
    expect(await run(update("/start"))).toBe("no_code");
    expect(rpc).not.toHaveBeenCalled();
    expect(sentText(fetchImpl)).toContain("abre el enlace");
  });

  it("ignores other messages, groups and malformed updates", async () => {
    const { run, rpc, fetchImpl } = setup({});
    expect(await run(update("hola"))).toBe("ignored");
    expect(await run(update("/start AB23CD", { id: -100, type: "group" }))).toBe("ignored");
    expect(await run({ update_id: 3 })).toBe("ignored");
    expect(await run("nonsense")).toBe("ignored");
    expect(await run(null)).toBe("ignored");
    expect(rpc).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("throws on an unexpected database error so Telegram delivers the update again", async () => {
    const { run } = setup({ error: { message: "boom", code: "XX000" } });
    await expect(run(update("/start AB23CD"))).rejects.toThrow("telegram_confirm_failed");
  });

  it("still reports the link when the reply cannot be sent", async () => {
    const { run, fetchImpl } = setup({ data: "id" });
    fetchImpl.mockRejectedValue(new Error("down"));
    expect(await run(update("/start AB23CD"))).toBe("linked");
  });
});
