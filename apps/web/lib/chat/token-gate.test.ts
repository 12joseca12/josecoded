import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTokenGate } from './token-gate';

describe('createTokenGate', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('resolves at once with a token already there and forgets it on clear', async () => {
    const gate = createTokenGate();
    gate.set('t1');
    await expect(gate.wait(20_000)).resolves.toBe('t1');
    gate.clear();
    const pending = gate.wait(1000);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toBeNull();
  });

  it('resolves a waiter when the token arrives', async () => {
    const gate = createTokenGate();
    const pending = gate.wait(20_000);
    gate.set('t2');
    await expect(pending).resolves.toBe('t2');
  });

  it('resolves null after the timeout when no token comes', async () => {
    const gate = createTokenGate();
    const pending = gate.wait(20_000);
    await vi.advanceTimersByTimeAsync(19_999);
    let settled = false;
    void pending.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toBeNull();
  });

  it('resolves null when the token expires or fails while waiting', async () => {
    const gate = createTokenGate();
    const pending = gate.wait(20_000);
    gate.set(null);
    await expect(pending).resolves.toBeNull();
    await vi.advanceTimersByTimeAsync(20_000); // the timer is gone: nothing left to fire
  });
});
