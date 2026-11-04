import { afterEach, describe, expect, it, vi } from "vitest";

import { withMinimumDuration } from "./timing";

afterEach(() => {
  vi.useRealTimers();
});

describe("withMinimumDuration", () => {
  it("holds a fast result until the minimum has passed", async () => {
    vi.useFakeTimers();
    let done = false;
    const pending = withMinimumDuration(700, () => Promise.resolve("sent")).then((value) => {
      done = true;
      return value;
    });
    await vi.advanceTimersByTimeAsync(699);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toBe("sent");
  });

  it("does not add time to a slow result", async () => {
    vi.useFakeTimers();
    const pending = withMinimumDuration(700, async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 900));
      return "slow";
    });
    await vi.advanceTimersByTimeAsync(900);
    expect(await pending).toBe("slow");
  });

  it("also waits when the work throws", async () => {
    vi.useFakeTimers();
    let settled = false;
    const pending = withMinimumDuration(700, () => Promise.reject(new Error("x"))).catch(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(699);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });
});
