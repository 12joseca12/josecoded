import { afterEach, expect, it, vi } from 'vitest';

import { createTypewriter, typeOnce } from './typewriter';

afterEach(() => vi.useRealTimers());

it('types at typeMs per char and stops when paused', () => {
  vi.useFakeTimers();
  const el = document.createElement('span');
  const t = createTypewriter(el, ['hola'], { typeMs: 22, eraseMs: 16, pauseMs: 700 });
  t.start();
  vi.advanceTimersByTime(22 * 2 + 1);
  expect(el.textContent).toBe('ho');
  t.pause();
  vi.advanceTimersByTime(1000);
  expect(el.textContent).toBe('ho');
});

it('holds the text, erases it and goes on with the next one', () => {
  vi.useFakeTimers();
  const el = document.createElement('span');
  const t = createTypewriter(el, ['ab', 'c'], { typeMs: 10, eraseMs: 5, pauseMs: 100 });
  t.start();
  vi.advanceTimersByTime(20);
  expect(el.textContent).toBe('ab');
  vi.advanceTimersByTime(99);
  expect(el.textContent).toBe('ab');
  vi.advanceTimersByTime(1 + 5 * 2);
  expect(el.textContent).toBe('');
  vi.advanceTimersByTime(10 + 1);
  expect(el.textContent).toBe('c');
});

it('typeOnce writes the whole text, calls done and can be cancelled', () => {
  vi.useFakeTimers();
  const el = document.createElement('p');
  const done = vi.fn();
  typeOnce(el, 'hey', 10, done);
  vi.advanceTimersByTime(30);
  expect(el.textContent).toBe('hey');
  expect(done).toHaveBeenCalledOnce();

  const other = document.createElement('p');
  const cancel = typeOnce(other, 'hey', 10);
  vi.advanceTimersByTime(10);
  cancel();
  vi.advanceTimersByTime(100);
  expect(other.textContent).toBe('h');
});
