import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { startScene } from './load-scene';

vi.mock('./after-lcp', () => ({ afterLcp: () => Promise.resolve(), idle: () => Promise.resolve() }));

const fake = {
  start: vi.fn(),
  skipIntro: vi.fn(),
  playIntro: vi.fn(),
  dispose: vi.fn(),
};
vi.mock('@josecoded/glyph-scene', () => ({ createGlyphScene: () => Promise.resolve(fake) }));

beforeEach(() => {
  Object.values(fake).forEach((fn) => fn.mockClear());
  delete document.documentElement.dataset.intro;
});

afterEach(() => {
  document.body.replaceChildren();
});

function setup(onContextLost?: () => void) {
  const stage = document.createElement('div');
  const canvasSlot = document.createElement('div');
  document.body.append(stage, canvasSlot);
  const run = startScene({ stage, bars: null, canvasSlot, field: null, ...(onContextLost ? { onContextLost } : null) });
  return { stage, canvasSlot, run };
}

it('goes live once running and keeps a canvas in the slot', async () => {
  const { stage, canvasSlot, run } = setup();
  await run.ready;
  expect(fake.start).toHaveBeenCalled();
  expect(stage.dataset.state).toBe('live');
  expect(canvasSlot.querySelector('canvas')).not.toBeNull();
});

it('on webglcontextlost disposes the scene, removes the canvas, clears the state and tells the caller', async () => {
  const onLost = vi.fn();
  const { stage, canvasSlot, run } = setup(onLost);
  await run.ready;
  const canvas = canvasSlot.querySelector('canvas') as HTMLCanvasElement;
  const event = new Event('webglcontextlost', { cancelable: true });
  canvas.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(fake.dispose).toHaveBeenCalledTimes(1);
  expect(canvasSlot.querySelector('canvas')).toBeNull();
  expect(stage.dataset.state).toBeUndefined();
  expect(onLost).toHaveBeenCalledTimes(1);
});

it('ignores a context loss after stop() (the cleanup disposes the context itself)', async () => {
  const onLost = vi.fn();
  const { canvasSlot, run } = setup(onLost);
  await run.ready;
  const canvas = canvasSlot.querySelector('canvas') as HTMLCanvasElement;
  run.stop();
  canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  expect(onLost).not.toHaveBeenCalled();
  expect(fake.dispose).toHaveBeenCalledTimes(1);
});
