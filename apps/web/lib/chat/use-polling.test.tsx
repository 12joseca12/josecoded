import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePolling } from './use-polling';

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setHidden(false);
  });
  afterEach(() => vi.useRealTimers());

  it('ticks on the interval, pauses while the tab is hidden and ticks again at once when it returns', async () => {
    const tick = vi.fn();
    renderHook(() => usePolling(tick, { intervalMs: 1000, enabled: true }));
    await act(() => vi.advanceTimersByTimeAsync(2500));
    expect(tick).toHaveBeenCalledTimes(2);
    act(() => setHidden(true));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(tick).toHaveBeenCalledTimes(2);
    await act(async () => setHidden(false));
    expect(tick).toHaveBeenCalledTimes(3);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(tick).toHaveBeenCalledTimes(4);
  });

  it('does nothing while disabled and stops on unmount', async () => {
    const tick = vi.fn();
    const { rerender, unmount } = renderHook(({ enabled }) => usePolling(tick, { intervalMs: 1000, enabled }), { initialProps: { enabled: false } });
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(tick).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(tick).toHaveBeenCalledTimes(1);
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(tick).toHaveBeenCalledTimes(1);
  });

  it('does not start a tick while the previous one is still running', async () => {
    let release: () => void = () => undefined;
    const tick = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));
    renderHook(() => usePolling(tick, { intervalMs: 1000, enabled: true }));
    await act(() => vi.advanceTimersByTimeAsync(3500));
    expect(tick).toHaveBeenCalledTimes(1);
    await act(async () => release());
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('backs off 6 s -> 12 -> 24 -> 48 -> 60 s cap after failed ticks and resets on success', async () => {
    let outcome: 'fail' | 'ok' = 'fail';
    const tick = vi.fn(async () => outcome);
    renderHook(() => usePolling(tick, { intervalMs: 6000, enabled: true }));
    const calls = () => tick.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(6000));
    expect(calls()).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(11_999));
    expect(calls()).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(calls()).toBe(2);
    await act(() => vi.advanceTimersByTimeAsync(24_000));
    expect(calls()).toBe(3);
    await act(() => vi.advanceTimersByTimeAsync(48_000));
    expect(calls()).toBe(4);
    await act(() => vi.advanceTimersByTimeAsync(59_999));
    expect(calls()).toBe(4);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(calls()).toBe(5);
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(calls()).toBe(6);
    outcome = 'ok';
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(calls()).toBe(7);
    await act(() => vi.advanceTimersByTimeAsync(6000));
    expect(calls()).toBe(8);
  });

  it('a throwing tick counts as a failure', async () => {
    const tick = vi.fn(async () => {
      throw new Error('boom');
    });
    renderHook(() => usePolling(tick, { intervalMs: 1000, enabled: true }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    await act(() => vi.advanceTimersByTimeAsync(1999));
    expect(tick).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('stops for good when a tick returns stop, even after the tab comes back', async () => {
    const tick = vi.fn(async () => 'stop' as const);
    renderHook(() => usePolling(tick, { intervalMs: 1000, enabled: true }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(tick).toHaveBeenCalledTimes(1);
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(tick).toHaveBeenCalledTimes(1);
    act(() => setHidden(true));
    await act(async () => setHidden(false));
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(tick).toHaveBeenCalledTimes(1);
  });
});
