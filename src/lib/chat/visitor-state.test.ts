import { describe, expect, it } from "vitest";

import type { ChatStatus } from "@/types/chat";

import { visitorNexoState, type VisitorStateInput } from "./visitor-state";

const status: ChatStatus = {
  nexoOnline: true,
  aiEnabled: true,
  pendingReply: false,
  handoffDone: false,
  quotaExceeded: false,
  connection: "online",
};

const base: VisitorStateInput = {
  status,
  drafting: false,
  sending: false,
  speaking: false,
  failed: false,
  fresh: false,
  leadSaved: false,
};

describe("visitorNexoState", () => {
  it("greets a fresh visitor and rests afterwards", () => {
    expect(visitorNexoState({ ...base, fresh: true })).toBe("greeting");
    expect(visitorNexoState(base)).toBe("idle");
  });

  it("follows the conversation", () => {
    expect(visitorNexoState({ ...base, drafting: true })).toBe("listening");
    expect(visitorNexoState({ ...base, sending: true })).toBe("thinking");
    expect(visitorNexoState({ ...base, status: { ...status, pendingReply: true } })).toBe(
      "thinking",
    );
    expect(visitorNexoState({ ...base, speaking: true })).toBe("talking");
    expect(visitorNexoState({ ...base, leadSaved: true })).toBe("happy");
  });

  it("stays at rest when Nexo is offline or Jose took over", () => {
    expect(visitorNexoState({ ...base, status: { ...status, nexoOnline: false } })).toBe("idle");
    expect(
      visitorNexoState({ ...base, status: { ...status, aiEnabled: false }, sending: true }),
    ).toBe("idle");
  });

  it("shows sadness on failures and quota", () => {
    expect(visitorNexoState({ ...base, failed: true })).toBe("sad");
    expect(visitorNexoState({ ...base, status: { ...status, quotaExceeded: true } })).toBe("sad");
  });
});
