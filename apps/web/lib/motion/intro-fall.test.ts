import { afterEach, expect, it, vi } from 'vitest';

import { planFall, runIntro } from './intro-fall';

function chars(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const s = document.createElement('span');
    s.className = 'ch';
    s.dataset.ch = String.fromCharCode(65 + (i % 26));
    s.textContent = s.dataset.ch;
    document.body.append(s);
    return s;
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.intro;
  document.body.replaceChildren();
});

it('every landing time is within [0.4, 1.2] s and deterministic per seed', () => {
  const a = planFall(chars(40), 7, 800);
  const b = planFall(chars(40), 7, 800);
  for (const p of a) {
    expect(p.landT).toBeGreaterThanOrEqual(0.4);
    expect(p.landT).toBeLessThanOrEqual(1.2);
    expect(p.start).toBeLessThan(0);
  }
  expect(a.map((p) => p.landT)).toEqual(b.map((p) => p.landT));
  expect(a.map((p) => p.start)).toEqual(b.map((p) => p.start));
  expect(a.map((p) => p.glyph)).toEqual(b.map((p) => p.glyph));
});

it('starts above the final place, between 0.35 and 1.1 viewport heights', () => {
  for (const p of planFall(chars(60), 3, 1000)) {
    expect(p.start).toBeLessThanOrEqual(-350);
    expect(p.start).toBeGreaterThanOrEqual(-1100);
  }
});

it('a different seed gives a different fall', () => {
  const a = planFall(chars(20), 1, 800).map((p) => p.landT);
  const b = planFall(chars(20), 2, 800).map((p) => p.landT);
  expect(a).not.toEqual(b);
});

it('finish() lands everything in one frame and keeps final letters', () => {
  vi.useFakeTimers();
  document.documentElement.dataset.intro = 'pending';
  const root = document.createElement('div');
  root.append(...chars(10));
  document.body.append(root);
  const onDone = vi.fn();
  runIntro({ root, onDone });
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
  vi.advanceTimersByTime(200);
  for (const el of root.querySelectorAll<HTMLElement>('.ch')) {
    expect(el.textContent).toBe(el.dataset.ch);
    expect(el.classList.contains('is-falling')).toBe(false);
    expect(el.style.transform).toBe('');
  }
  expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ skipped: true }));
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(document.documentElement.dataset.intro).toBeUndefined();
});

it('plays to the end by itself, lands every letter and reports skipped: false', () => {
  vi.useFakeTimers();
  document.documentElement.dataset.intro = 'pending';
  const root = document.createElement('div');
  root.append(...chars(12));
  document.body.append(root);
  const onDone = vi.fn();
  runIntro({ root, onDone });
  // mid-fall: something is still falling
  vi.advanceTimersByTime(300);
  expect(root.querySelectorAll('.is-falling').length).toBeGreaterThan(0);
  expect(document.documentElement.dataset.intro).toBeUndefined();
  vi.advanceTimersByTime(3000);
  expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ skipped: false, mode: 'letters' }));
  for (const el of root.querySelectorAll<HTMLElement>('.ch')) {
    expect(el.textContent).toBe(el.dataset.ch);
    expect(el.className).toBe('ch');
    expect(el.style.transform).toBe('');
  }
});

it('waits for the scene, at most 1.2 s, and then falls alone', () => {
  vi.useFakeTimers();
  document.documentElement.dataset.intro = 'pending';
  const root = document.createElement('div');
  root.append(...chars(6));
  document.body.append(root);
  const onStart = vi.fn();
  runIntro({ root, sceneReady: new Promise(() => undefined), onStart, onDone: vi.fn() });
  vi.advanceTimersByTime(1100);
  expect(onStart).not.toHaveBeenCalled();
  // letters stay hidden by the gate while they wait
  expect(document.documentElement.dataset.intro).toBe('armed');
  vi.advanceTimersByTime(200);
  expect(onStart).toHaveBeenCalledTimes(1);
  expect(document.documentElement.dataset.intro).toBeUndefined();
});

it('starts at once, with a shared t0, when the scene is ready first', async () => {
  vi.useFakeTimers();
  document.documentElement.dataset.intro = 'pending';
  const root = document.createElement('div');
  root.append(...chars(6));
  document.body.append(root);
  const onStart = vi.fn();
  const mode = vi.fn();
  runIntro({ root, sceneReady: Promise.resolve(), onStart, onDone: mode });
  await vi.advanceTimersByTimeAsync(50);
  expect(onStart).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(3000);
  expect(mode).toHaveBeenCalledWith(expect.objectContaining({ mode: 'full' }));
});

it('with reduced motion nothing animates: letters are final and mode is none', () => {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
  document.documentElement.dataset.intro = 'pending';
  const root = document.createElement('div');
  root.append(...chars(5));
  document.body.append(root);
  const onDone = vi.fn();
  runIntro({ root, onDone });
  expect(onDone).toHaveBeenCalledWith({ skipped: false, reduced: true, mode: 'none' });
  expect(document.documentElement.dataset.intro).toBeUndefined();
  expect(root.querySelectorAll('.is-falling')).toHaveLength(0);
});

it('cancel() stops without reporting and re-arms the gate (React strict mode remount)', () => {
  vi.useFakeTimers();
  document.documentElement.dataset.intro = 'pending';
  const root = document.createElement('div');
  root.append(...chars(5));
  document.body.append(root);
  const onDone = vi.fn();
  const run = runIntro({ root, onDone });
  vi.advanceTimersByTime(100);
  run.cancel();
  expect(onDone).not.toHaveBeenCalled();
  expect(document.documentElement.dataset.intro).toBe('pending');
  expect(root.querySelectorAll('.is-falling')).toHaveLength(0);
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
  expect(onDone).not.toHaveBeenCalled();
});
