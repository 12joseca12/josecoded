import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { HERO_MODE_GATE } from '.';

let stage: HTMLElement;

function matchMediaStub(matches: Record<string, boolean>) {
  return (query: string) => ({
    matches: Object.entries(matches).some(([key, value]) => value && query.includes(key)),
  });
}

function webgl2(available: boolean) {
  const lose = vi.fn();
  const context = { getExtension: () => ({ loseContext: lose }) };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((kind: string) =>
    kind === 'webgl2' && available ? context : null) as never);
  return lose;
}

function run() {
  const script = document.createElement('script');
  stage.prepend(script);
  Object.defineProperty(document, 'currentScript', { value: script, configurable: true });
  new Function(HERO_MODE_GATE)();
}

beforeEach(() => {
  vi.useFakeTimers();
  stage = document.createElement('div');
  stage.innerHTML = '<picture><source data-poster-placeholder></picture>';
  document.body.append(stage);
  vi.stubGlobal('matchMedia', matchMediaStub({ 'min-width': true }));
  webgl2(true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, 'currentScript');
  document.body.replaceChildren();
});

it('is small enough to inline in the stage (under 700 bytes)', () => {
  expect(new TextEncoder().encode(HERO_MODE_GATE).length).toBeLessThanOrEqual(700);
});

it('marks the stage as scene on a capable desktop and releases the probe context', () => {
  const lose = webgl2(true);
  run();
  expect(stage.dataset.mode).toBe('scene');
  expect(lose).toHaveBeenCalled();
});

it.each([
  ['a narrow viewport', { 'min-width': false }],
  ['reduced motion', { 'min-width': true, reduce: true }],
])('leaves the poster alone on %s', (_name, media) => {
  vi.stubGlobal('matchMedia', matchMediaStub(media));
  run();
  expect(stage.dataset.mode).toBeUndefined();
});

it('leaves the poster alone without WebGL2', () => {
  webgl2(false);
  run();
  expect(stage.dataset.mode).toBeUndefined();
});

it('leaves the poster alone with Save-Data or little memory', () => {
  vi.stubGlobal('navigator', { connection: { saveData: true } });
  run();
  expect(stage.dataset.mode).toBeUndefined();
  vi.stubGlobal('navigator', { deviceMemory: 2 });
  run();
  expect(stage.dataset.mode).toBeUndefined();
});

it('gives the poster back after 3 s if the page script never arms the stage', () => {
  run();
  vi.advanceTimersByTime(3000);
  expect(stage.dataset.mode).toBeUndefined();
  expect(stage.querySelector('[data-poster-placeholder]')).toBeNull();
});

it('keeps the scene mark once the gate has armed the stage', () => {
  run();
  stage.dataset.armed = '';
  vi.advanceTimersByTime(3000);
  expect(stage.dataset.mode).toBe('scene');
  expect(stage.querySelector('[data-poster-placeholder]')).not.toBeNull();
});

it('never throws when there is no current script', () => {
  expect(() => new Function(HERO_MODE_GATE)()).not.toThrow();
});
