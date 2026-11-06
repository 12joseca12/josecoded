import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { chatReplyResultSchema } from "./chat-reply-result";
import { omenContextSchema } from "./omen-context";

function fixture(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(process.cwd(), path), "utf8")) as Record<string, unknown>;
}

describe("chat.reply result contract", () => {
  const result = fixture("contracts/jobs/chat.reply.result.json");

  it("parses the shared fixture", () => {
    expect(chatReplyResultSchema.parse(result)).toMatchObject({ model: "groq:llama-3.3-70b" });
  });

  it("rejects a bad model, an empty body and a confidence outside 0..1", () => {
    expect(chatReplyResultSchema.safeParse({ ...result, model: "other:x" }).success).toBe(false);
    expect(chatReplyResultSchema.safeParse({ ...result, body: "" }).success).toBe(false);
    expect(chatReplyResultSchema.safeParse({ ...result, confidence: 1.2 }).success).toBe(false);
    expect(chatReplyResultSchema.safeParse({ ...result, body: "x".repeat(4001) }).success).toBe(
      false,
    );
  });
});

describe("Omen conversation context contract", () => {
  const context = fixture("contracts/omen/conversation-context.json");

  it("parses the shared fixture", () => {
    expect(omenContextSchema.parse(context)).toMatchObject({
      conversation: { consent_state: "granted" },
      project: { phase: "build" },
    });
  });

  it("parses a context without consent that carries no project or messages", () => {
    const bare = {
      conversation: { ...(context.conversation as object), consent_state: "pending" },
      members: [],
      messages: [],
    };
    const parsed = omenContextSchema.parse(bare);
    expect(parsed.project).toBeUndefined();
  });

  it("rejects an unknown phase and more than 30 messages", () => {
    expect(
      omenContextSchema.safeParse({
        ...context,
        project: { name: "x", phase: "nope", brief: null },
      }).success,
    ).toBe(false);
    const message = (context.messages as object[])[0];
    expect(
      omenContextSchema.safeParse({ ...context, messages: Array(31).fill(message) }).success,
    ).toBe(false);
  });
});
