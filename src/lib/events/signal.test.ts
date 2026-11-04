import { describe, expect, it, vi } from "vitest";

import { createSignal } from "./signal";

describe("signal", () => {
  it("reports false when nothing is subscribed", () => {
    const signal = createSignal();
    expect(signal.hasListeners()).toBe(false);
    expect(signal.emit()).toBe(false);
  });

  it("notifies every listener and reports true", () => {
    const signal = createSignal();
    const a = vi.fn();
    const b = vi.fn();
    signal.subscribe(a);
    signal.subscribe(b);
    expect(signal.emit()).toBe(true);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("stops notifying after unsubscribe", () => {
    const signal = createSignal();
    const listener = vi.fn();
    const off = signal.subscribe(listener);
    off();
    expect(signal.hasListeners()).toBe(false);
    expect(signal.emit()).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("tolerates a listener unsubscribing while emitting", () => {
    const signal = createSignal();
    const second = vi.fn();
    const off = signal.subscribe(() => {
      off();
    });
    signal.subscribe(second);
    signal.emit();
    expect(second).toHaveBeenCalledOnce();
    expect(signal.hasListeners()).toBe(true);
  });
});
