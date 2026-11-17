import { afterEach, describe, expect, it, vi } from "vitest";

import { chatEmbedMounted, openChatOrEmbed, registerChatEmbed } from "./chat-embed";
import { onOpenChat } from "./chat-events";

describe("chat embed", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    while (cleanups.length > 0) cleanups.pop()?.();
  });

  it("focuses the embedded chat instead of opening the panel", () => {
    const panel = vi.fn();
    const focus = vi.fn();
    cleanups.push(onOpenChat(panel), registerChatEmbed(focus));
    expect(chatEmbedMounted()).toBe(true);
    expect(openChatOrEmbed()).toBe(true);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(panel).not.toHaveBeenCalled();
  });

  it("falls back to the panel once the embed unmounts", () => {
    const panel = vi.fn();
    cleanups.push(onOpenChat(panel));
    registerChatEmbed(vi.fn())();
    expect(chatEmbedMounted()).toBe(false);
    expect(openChatOrEmbed()).toBe(true);
    expect(panel).toHaveBeenCalledTimes(1);
  });

  it("reports false when neither exists", () => {
    expect(openChatOrEmbed()).toBe(false);
  });

  it("keeps a newer embed when an older one unregisters late", () => {
    const first = vi.fn();
    const second = vi.fn();
    const offFirst = registerChatEmbed(first);
    cleanups.push(registerChatEmbed(second));
    offFirst();
    openChatOrEmbed();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
