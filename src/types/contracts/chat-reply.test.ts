import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { chatReplyPayloadSchema } from "./chat-reply";

const fixture: unknown = JSON.parse(
  readFileSync(join(process.cwd(), "contracts/jobs/chat.reply.json"), "utf8"),
);

describe("chat.reply payload contract", () => {
  it("parses the shared fixture", () => {
    expect(chatReplyPayloadSchema.parse(fixture)).toMatchObject({ kind: "closer", delayed: true });
  });

  it("rejects an unknown kind and a missing flag", () => {
    expect(
      chatReplyPayloadSchema.safeParse({ ...(fixture as object), kind: "other" }).success,
    ).toBe(false);
    const rest: Record<string, unknown> = { ...(fixture as object) };
    delete rest.delayed;
    expect(chatReplyPayloadSchema.safeParse(rest).success).toBe(false);
  });
});
