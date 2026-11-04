import { describe, expect, it, vi } from "vitest";

import { chatFallbackHref, chatPanelMounted, onOpenChat, openChat } from "./chat-events";

describe("chat events", () => {
  it("returns false and does nothing when no panel is subscribed", () => {
    expect(chatPanelMounted()).toBe(false);
    expect(openChat()).toBe(false);
  });

  it("delivers openChat to the subscribed panel", () => {
    const panel = vi.fn();
    const off = onOpenChat(panel);
    expect(chatPanelMounted()).toBe(true);
    expect(openChat()).toBe(true);
    expect(panel).toHaveBeenCalledOnce();
    off();
    expect(openChat()).toBe(false);
  });

  it("builds the contact fallback for a locale", () => {
    expect(chatFallbackHref("es")).toBe("/es/contacto#chat");
    expect(chatFallbackHref("en")).toBe("/en/contacto#chat");
  });
});
