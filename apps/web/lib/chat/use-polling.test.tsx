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
});
