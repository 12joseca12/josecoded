import { describe, expect, it, vi } from "vitest";

import { isSearchShortcut, onOpenSearch, openSearch } from "./search-events";

const press = (key: string, modifiers: Partial<Record<string, boolean>> = {}) => ({
  key,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...modifiers,
});

describe("search events", () => {
  it("does nothing visible when nothing subscribes", () => {
    expect(openSearch()).toBe(false);
  });

  it("notifies the search dialog", () => {
    const dialog = vi.fn();
    const off = onOpenSearch(dialog);
    expect(openSearch()).toBe(true);
    expect(dialog).toHaveBeenCalledOnce();
    off();
  });

  it("recognises Cmd+K and Ctrl+K only", () => {
    expect(isSearchShortcut(press("k", { metaKey: true }))).toBe(true);
    expect(isSearchShortcut(press("K", { ctrlKey: true }))).toBe(true);
    expect(isSearchShortcut(press("k"))).toBe(false);
    expect(isSearchShortcut(press("j", { metaKey: true }))).toBe(false);
    expect(isSearchShortcut(press("k", { metaKey: true, shiftKey: true }))).toBe(false);
    expect(isSearchShortcut(press("k", { ctrlKey: true, altKey: true }))).toBe(false);
  });
});
