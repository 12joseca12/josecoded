import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createToastStore } from "./toast-store";

const info = (message: string) => ({ tone: "info" as const, message });

describe("toast store", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("adds toasts and notifies subscribers", () => {
    const store = createToastStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.push(info("a"));
    expect(store.getSnapshot().map((item) => item.message)).toEqual(["a"]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps at most three, dropping the oldest", () => {
    const store = createToastStore();
    ["a", "b", "c", "d"].forEach((message) => store.push(info(message)));
    expect(store.getSnapshot().map((item) => item.message)).toEqual(["b", "c", "d"]);
  });

  it("dismisses automatically after the duration", () => {
    const store = createToastStore({ duration: 1000 });
    store.push(info("a"));
    vi.advanceTimersByTime(999);
    expect(store.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(store.getSnapshot()).toHaveLength(0);
  });

  it("keeps errors longer than other tones", () => {
    const store = createToastStore({ duration: 1000, errorDuration: 3000 });
    store.push({ tone: "error", message: "boom" });
    vi.advanceTimersByTime(2999);
    expect(store.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(store.getSnapshot()).toHaveLength(0);
  });

  it("pauses while hovered and resumes with the remaining time", () => {
    const store = createToastStore({ duration: 1000 });
    const id = store.push(info("a"));
    vi.advanceTimersByTime(600);
    store.pause(id);
    vi.advanceTimersByTime(10_000);
    expect(store.getSnapshot()).toHaveLength(1);
    store.resume(id);
    vi.advanceTimersByTime(399);
    expect(store.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(store.getSnapshot()).toHaveLength(0);
  });

  it("dismisses by id and ignores unknown ids", () => {
    const store = createToastStore();
    const listener = vi.fn();
    const id = store.push(info("a"));
    store.subscribe(listener);
    store.dismiss(999);
    expect(listener).not.toHaveBeenCalled();
    store.dismiss(id);
    expect(store.getSnapshot()).toHaveLength(0);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
