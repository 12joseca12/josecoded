import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  chatFallbackHref,
  chatPanelMounted,
  closeChat,
  isChatOpen,
  onChatOpenChange,
  onCloseChat,
  onOpenChat,
  openChat,
  setChatOpen,
} from "./chat-events";

describe("chat events", () => {
  const marks = new Set<string>();

  beforeEach(() => {
    marks.clear();
    vi.stubGlobal("document", {
      documentElement: {
        toggleAttribute: (name: string, force: boolean) => {
          if (force) marks.add(name);
          else marks.delete(name);
        },
      },
    });
  });

  afterEach(() => {
    setChatOpen(false);
    vi.unstubAllGlobals();
  });

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

  it("tells the panel to close and reports whether anyone listens", () => {
    expect(closeChat()).toBe(false);
    const close = vi.fn();
    const off = onCloseChat(close);
    expect(closeChat()).toBe(true);
    expect(close).toHaveBeenCalledOnce();
    off();
    expect(closeChat()).toBe(false);
  });

  it("builds the contact fallback for a locale", () => {
    expect(chatFallbackHref("es")).toBe("/es/contacto#chat");
    expect(chatFallbackHref("en")).toBe("/en/contacto#chat");
  });

  it("re-marks the document when the open state is re-asserted after a reset", () => {
    setChatOpen(true);
    setChatOpen(false);
    setChatOpen(true);
    expect(marks.has("data-chat-open")).toBe(true);
  });

  it("marks the document while the panel is open and notifies once per change", () => {
    const listener = vi.fn();
    const off = onChatOpenChange(listener);
    setChatOpen(true);
    setChatOpen(true);
    expect(isChatOpen()).toBe(true);
    expect(marks.has("data-chat-open")).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
    setChatOpen(false);
    expect(isChatOpen()).toBe(false);
    expect(marks.has("data-chat-open")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    off();
  });
});
