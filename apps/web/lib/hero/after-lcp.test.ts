import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { afterLoadAndIntent } from './after-lcp';

let readyState: DocumentReadyState;

beforeEach(() => {
  vi.useFakeTimers();
  readyState = 'complete';
  vi.spyOn(document, 'readyState', 'get').mockImplementation(() => readyState);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const track = (promise: Promise<void>) => {
  const state = { done: false };
  void promise.then(() => {
    state.done = true;
  });
  return state;
};

it('waits for the delay once the page has loaded', async () => {
  const state = track(afterLoadAndIntent(new AbortController().signal, 1000));
  await vi.advanceTimersByTimeAsync(999);
  expect(state.done).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(state.done).toBe(true);
});

it('does not start counting before load', async () => {
  readyState = 'loading';
  const state = track(afterLoadAndIntent(new AbortController().signal, 1000));
  await vi.advanceTimersByTimeAsync(5000);
  expect(state.done).toBe(false);
  window.dispatchEvent(new Event('load'));
  await vi.advanceTimersByTimeAsync(1000);
  expect(state.done).toBe(true);
});

it('the first input ends the wait', async () => {
  const state = track(afterLoadAndIntent(new AbortController().signal, 10_000));
  window.dispatchEvent(new Event('pointerdown'));
  await vi.advanceTimersByTimeAsync(0);
  expect(state.done).toBe(true);
});

it('an aborted signal ends the wait too', async () => {
  const abort = new AbortController();
  const state = track(afterLoadAndIntent(abort.signal, 10_000));
  abort.abort();
  await vi.advanceTimersByTimeAsync(0);
  expect(state.done).toBe(true);
});
